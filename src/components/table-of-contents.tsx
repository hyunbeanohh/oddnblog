import * as React from "react"

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLElement | null>
  railRef: React.RefObject<HTMLElement | null>
}

interface TocItem {
  id: string
  text: string
  level: 2 | 3
  parentId?: string
}

interface TocGroup {
  id: string
  text: string
  children: TocItem[]
}

interface HeadingMetric {
  id: string
  top: number
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\-가-힣]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

const HEADER_HEIGHT = 60
const DESKTOP_FLOAT_TOP_GAP = 24
const DESKTOP_FLOAT_TOP = HEADER_HEIGHT + DESKTOP_FLOAT_TOP_GAP
const DESKTOP_MIN_WIDTH = 1024

const TableOfContents = ({ contentRef, railRef }: TableOfContentsProps) => {
  const [items, setItems] = React.useState<TocItem[]>([])
  const [groups, setGroups] = React.useState<TocGroup[]>([])
  const [activeId, setActiveId] = React.useState("")
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})

  const activeIdRef = React.useRef("")
  const headingMetricsRef = React.useRef<HeadingMetric[]>([])
  const lastActiveChangeAtRef = React.useRef(0)
  const lastScrollYRef = React.useRef(0)
  const lastScrollSampleAtRef = React.useRef(0)
  const navigatingTargetRef = React.useRef<string | null>(null)
  const navigatingDeadlineRef = React.useRef(0)
  const navigatingSettleUntilRef = React.useRef(0)

  const desktopTocRef = React.useRef<HTMLElement>(null)
  const mobileTocRef = React.useRef<HTMLElement>(null)
  const desktopCardRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  React.useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const headingElements = Array.from(content.querySelectorAll("h2, h3"))
    const slugCount = new Map<string, number>()
    const nextItems: TocItem[] = []
    const nextGroups: TocGroup[] = []
    let currentH2Id: string | undefined

    headingElements.forEach(heading => {
      const text = heading.textContent?.trim() ?? ""
      if (!text) return

      const level = Number(heading.tagName[1]) as 2 | 3
      const baseSlug = slugify(text) || "section"
      const count = slugCount.get(baseSlug) ?? 0
      slugCount.set(baseSlug, count + 1)
      const generatedId = count === 0 ? baseSlug : `${baseSlug}-${count}`

      if (!heading.id) {
        heading.id = generatedId
      }

      if (level === 2) {
        currentH2Id = heading.id
        nextItems.push({ id: heading.id, text, level })
        nextGroups.push({ id: heading.id, text, children: [] })
        return
      }

      const parentId = currentH2Id
      nextItems.push({ id: heading.id, text, level, parentId })
      if (!parentId) return
      const group = nextGroups.find(item => item.id === parentId)
      if (group) group.children.push({ id: heading.id, text, level, parentId })
    })

    setItems(nextItems)
    setGroups(nextGroups)

    const nextExpanded: Record<string, boolean> = {}
    nextGroups.forEach((group, index) => {
      nextExpanded[group.id] = index === 0
    })

    let initialActiveId = nextItems[0]?.id ?? ""
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.replace("#", "")
      const matched = nextItems.find(item => item.id === hashId)
      if (matched) {
        initialActiveId = matched.id
      }
    }

    const initialItem = nextItems.find(item => item.id === initialActiveId)
    if (initialItem?.level === 2) {
      nextExpanded[initialItem.id] = true
    }
    if (initialItem?.level === 3 && initialItem.parentId) {
      nextExpanded[initialItem.parentId] = true
    }

    setExpanded(nextExpanded)
    setActiveId(initialActiveId)
  }, [contentRef])

  React.useEffect(() => {
    if (items.length === 0) return
    if (typeof window === "undefined") return

    let rafId = 0
    let needsMetricsRefresh = true
    const activationOffset = 124
    const indexById = new Map<string, number>()
    items.forEach((item, index) => indexById.set(item.id, index))

    const refreshHeadingMetrics = () => {
      headingMetricsRef.current = items
        .map(item => {
          const element = document.getElementById(item.id)
          if (!element) return null
          return {
            id: item.id,
            top: element.getBoundingClientRect().top + window.scrollY,
          }
        })
        .filter((metric): metric is HeadingMetric => metric !== null)
    }

    const findActiveId = (lineY: number): string => {
      const metrics = headingMetricsRef.current
      if (metrics.length === 0) return ""

      let left = 0
      let right = metrics.length - 1
      let answer = 0

      while (left <= right) {
        const mid = (left + right) >> 1
        if (metrics[mid].top <= lineY) {
          answer = mid
          left = mid + 1
        } else {
          right = mid - 1
        }
      }

      return metrics[answer].id
    }

    const frame = () => {
      rafId = 0

      if (needsMetricsRefresh) {
        refreshHeadingMetrics()
        needsMetricsRefresh = false
      }

      const metrics = headingMetricsRef.current
      if (metrics.length === 0) return

      const now = performance.now()
      const scrollY = window.scrollY
      const lineY = scrollY + activationOffset
      const lastSampleAt = lastScrollSampleAtRef.current || now
      const lastScrollY = lastScrollYRef.current || scrollY
      const dt = Math.max(16, now - lastSampleAt)
      const speedPxPerMs = Math.abs(scrollY - lastScrollY) / dt
      lastScrollYRef.current = scrollY
      lastScrollSampleAtRef.current = now

      const viewportBottom = scrollY + window.innerHeight
      const pageBottom = document.documentElement.scrollHeight - 2
      let nextActiveId =
        viewportBottom >= pageBottom
          ? metrics[metrics.length - 1].id
          : findActiveId(lineY)

      const navigatingTarget = navigatingTargetRef.current
      if (navigatingTarget) {
        const targetMetric = metrics.find(metric => metric.id === navigatingTarget)
        if (targetMetric) {
          const arrived = Math.abs(targetMetric.top - lineY) <= 12
          const expired = now > navigatingDeadlineRef.current

          nextActiveId = navigatingTarget
          if (arrived && navigatingSettleUntilRef.current === 0) {
            navigatingSettleUntilRef.current = now + 220
          }

          if (arrived && now >= navigatingSettleUntilRef.current) {
            navigatingTargetRef.current = null
            navigatingDeadlineRef.current = 0
            navigatingSettleUntilRef.current = 0
          } else if (expired) {
            navigatingTargetRef.current = null
            navigatingDeadlineRef.current = 0
            navigatingSettleUntilRef.current = 0
          }
        } else {
          navigatingTargetRef.current = null
          navigatingDeadlineRef.current = 0
          navigatingSettleUntilRef.current = 0
        }
      }

      const currentActiveId = activeIdRef.current
      if (currentActiveId && nextActiveId !== currentActiveId) {
        const currentMetric = metrics.find(metric => metric.id === currentActiveId)
        if (currentMetric && Math.abs(currentMetric.top - lineY) <= 28) {
          nextActiveId = currentActiveId
        } else {
          const currentIndex = indexById.get(currentActiveId) ?? 0
          const nextIndex = indexById.get(nextActiveId) ?? currentIndex
          const distance = Math.abs(nextIndex - currentIndex)
          const minSwitchInterval =
            speedPxPerMs > 2.0 ? 160 :
            speedPxPerMs > 1.2 ? 130 :
            speedPxPerMs > 0.7 ? 95 : 60

          if (distance <= 1 && now - lastActiveChangeAtRef.current < minSwitchInterval) {
            nextActiveId = currentActiveId
          }
        }
      }

      if (nextActiveId && nextActiveId !== activeIdRef.current) {
        lastActiveChangeAtRef.current = now
        setActiveId(nextActiveId)
      }
    }

    const scheduleFrame = (refreshMetrics = false) => {
      if (refreshMetrics) needsMetricsRefresh = true
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(frame)
    }

    const onScroll = () => scheduleFrame(false)
    const onResize = () => scheduleFrame(true)
    const onLoad = () => scheduleFrame(true)
    const onOrientationChange = () => scheduleFrame(true)

    scheduleFrame(true)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    window.addEventListener("load", onLoad)
    window.addEventListener("orientationchange", onOrientationChange)

    const content = contentRef.current
    const resizeObserver =
      content && "ResizeObserver" in window
        ? new ResizeObserver(() => scheduleFrame(true))
        : null
    if (content && resizeObserver) {
      resizeObserver.observe(content)
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("load", onLoad)
      window.removeEventListener("orientationchange", onOrientationChange)
      resizeObserver?.disconnect()
    }
  }, [items, contentRef])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const card = desktopCardRef.current
    const rail = railRef.current
    if (!card || !rail) return

    let rafId = 0
    let currentTranslateY = 0
    let targetTranslateY = 0

    const isDesktopViewport = () => window.innerWidth >= DESKTOP_MIN_WIDTH

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max)

    const apply = (value: number) => {
      card.style.transform = `translate3d(0, ${value.toFixed(2)}px, 0)`
    }

    const animate = () => {
      const delta = targetTranslateY - currentTranslateY
      if (Math.abs(delta) <= 0.35) {
        currentTranslateY = targetTranslateY
        apply(currentTranslateY)
        rafId = 0
        return
      }

      currentTranslateY += delta * 0.18
      apply(currentTranslateY)
      rafId = window.requestAnimationFrame(animate)
    }

    const updateTarget = () => {
      if (!isDesktopViewport()) {
        targetTranslateY = 0
        currentTranslateY = 0
        apply(0)
        if (rafId) {
          window.cancelAnimationFrame(rafId)
          rafId = 0
        }
        return
      }

      const railTop = rail.getBoundingClientRect().top + window.scrollY
      const railBottom = railTop + rail.offsetHeight
      const cardHeight = card.offsetHeight
      const maxTop = Math.max(railTop, railBottom - cardHeight)
      const desiredTop = window.scrollY + DESKTOP_FLOAT_TOP
      const clampedTop = clamp(desiredTop, railTop, maxTop)
      const cardTop = card.getBoundingClientRect().top + window.scrollY
      const baseTop = cardTop - currentTranslateY

      targetTranslateY = clampedTop - baseTop
      if (!Number.isFinite(targetTranslateY)) {
        targetTranslateY = 0
      }

      if (!rafId) {
        rafId = window.requestAnimationFrame(animate)
      }
    }

    updateTarget()

    const onScroll = () => updateTarget()
    const onResize = () => updateTarget()
    const onLoad = () => updateTarget()
    const onOrientationChange = () => updateTarget()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    window.addEventListener("load", onLoad)
    window.addEventListener("orientationchange", onOrientationChange)

    const resizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(() => updateTarget())
        : null
    resizeObserver?.observe(rail)
    resizeObserver?.observe(card)

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("load", onLoad)
      window.removeEventListener("orientationchange", onOrientationChange)
      resizeObserver?.disconnect()
    }
  }, [railRef, items.length])

  React.useEffect(() => {
    if (!activeId) return

    const syncActiveItem = (container: HTMLElement | null) => {
      if (!container) return
      const activeLink = container.querySelector<HTMLElement>(`[data-toc-id="${activeId}"]`)
      if (!activeLink) return

      const linkTop = activeLink.offsetTop
      const linkBottom = linkTop + activeLink.offsetHeight
      const viewTop = container.scrollTop
      const viewBottom = viewTop + container.clientHeight

      if (linkTop < viewTop) {
        container.scrollTop = Math.max(0, linkTop - 12)
        return
      }

      if (linkBottom > viewBottom) {
        container.scrollTop = Math.max(0, linkBottom - container.clientHeight + 12)
      }
    }

    syncActiveItem(desktopTocRef.current)
    if (mobileOpen) {
      syncActiveItem(mobileTocRef.current)
    }

    const activeItem = items.find(item => item.id === activeId)
    if (activeItem?.level === 2) {
      setExpanded(prev => (prev[activeItem.id] ? prev : { ...prev, [activeItem.id]: true }))
      return
    }

    if (activeItem?.level === 3 && activeItem.parentId) {
      setExpanded(prev =>
        prev[activeItem.parentId as string]
          ? prev
          : { ...prev, [activeItem.parentId as string]: true }
      )
    }
  }, [activeId, mobileOpen, items])

  const handleMove = (id: string) => {
    if (typeof window === "undefined") return

    navigatingTargetRef.current = id
    navigatingDeadlineRef.current = performance.now() + 1500
    navigatingSettleUntilRef.current = 0

    const hashUrl = `${window.location.pathname}${window.location.search}#${id}`
    window.history.replaceState(null, "", hashUrl)
    setActiveId(id)
    setMobileOpen(false)
  }

  const toggleGroup = (groupId: string) => {
    setExpanded(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  if (items.length === 0) return null

  const renderList = (container: "mobile" | "desktop") => {
    const isMobile = container === "mobile"

    return (
      <>
        <nav
          aria-label="목차"
          ref={isMobile ? mobileTocRef : desktopTocRef}
          className={isMobile ? "px-2 pb-3 max-h-64 overflow-y-auto" : "max-h-[calc(100vh-170px)] overflow-y-auto"}
        >
          {groups.map(group => {
            const groupActive =
              activeId === group.id || group.children.some(child => child.id === activeId)
            const open = expanded[group.id]
            const groupPanelId = `toc-group-${group.id}`

            return (
              <div key={group.id} className="mb-1">
                <div className="flex items-center gap-1">
                  <a
                    href={`#${group.id}`}
                    onClick={() => handleMove(group.id)}
                    data-toc-id={group.id}
                    title={group.text}
                    aria-current={activeId === group.id ? "location" : undefined}
                    className={`flex-1 truncate rounded-md px-2 py-2 text-sm leading-5 transition-colors ${
                      groupActive
                        ? "text-gray-900 dark:text-gray-100 font-semibold bg-gray-100/70 dark:bg-gray-800/70"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    }`}
                  >
                    {group.text}
                  </a>
                  {group.children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="h-9 w-9 rounded-md text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                      aria-expanded={open}
                      aria-controls={groupPanelId}
                      aria-label={open ? "소제목 접기" : "소제목 펼치기"}
                    >
                      {open ? "−" : "+"}
                    </button>
                  )}
                </div>

                {open && group.children.length > 0 && (
                  <div id={groupPanelId} className="mt-0.5">
                    {group.children.map(child => (
                      <a
                        key={child.id}
                        href={`#${child.id}`}
                        onClick={() => handleMove(child.id)}
                        data-toc-id={child.id}
                        title={child.text}
                        aria-current={activeId === child.id ? "location" : undefined}
                        className={`block truncate rounded-md pl-6 pr-2 py-2 text-sm leading-5 transition-colors ${
                          activeId === child.id
                            ? "text-gray-900 dark:text-gray-100 font-semibold bg-gray-100/70 dark:bg-gray-800/70"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                      >
                        {child.text}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </>
    )
  }

  return (
    <>
      <div className="lg:hidden mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60">
        <button
          type="button"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-toc"
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
        >
          목차
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {mobileOpen ? "닫기" : "열기"}
          </span>
        </button>
        {mobileOpen && <div id="mobile-toc">{renderList("mobile")}</div>}
      </div>

      <aside className="hidden lg:block">
        <div
          ref={desktopCardRef}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-4 will-change-transform"
        >
          <p className="text-xs font-semibold tracking-wide text-gray-400 dark:text-gray-500 mb-3">
            목차
          </p>
          {renderList("desktop")}
        </div>
      </aside>
    </>
  )
}

export default TableOfContents
