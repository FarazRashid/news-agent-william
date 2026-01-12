"use client"

import { useEffect, useState } from "react"

export type DeviceType = "mobile" | "fold" | "tablet" | "ipad" | "ipad-pro" | "trifold" | "desktop"

export interface DeviceInfo {
  type: DeviceType
  isMobile: boolean
  isFoldable: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
}

/**
 * Custom hook to detect device type based on screen width
 * Breakpoints:
 * - mobile: < 540px
 * - fold: 540px - 767px (fold phones unfolded)
 * - tablet: 768px - 819px (small tablets)
 * - ipad: 820px - 1023px (iPad Mini & standard iPads)
 * - ipad-pro: 1024px - 1199px (iPad Pro and large tablets)
 * - trifold: 1200px - 1279px (tri-fold phones fully unfolded)
 * - desktop: >= 1280px
 */
export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: "desktop",
    isMobile: false,
    isFoldable: false,
    isTablet: false,
    isDesktop: true,
    width: 1280,
  })

  useEffect(() => {
    const getDeviceType = (width: number): DeviceType => {
      if (width < 540) return "mobile"
      if (width >= 540 && width < 768) return "fold"
      if (width >= 768 && width < 820) return "tablet"
      if (width >= 820 && width < 1024) return "ipad"
      if (width >= 1024 && width < 1200) return "ipad-pro"
      if (width >= 1200 && width < 1280) return "trifold"
      return "desktop"
    }

    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const type = getDeviceType(width)

      setDeviceInfo({
        type,
        isMobile: width < 540,
        isFoldable: width >= 540 && width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1280,
        width,
      })
    }

    // Initial check
    updateDeviceInfo()

    // Add resize listener
    window.addEventListener("resize", updateDeviceInfo)

    // Cleanup
    return () => window.removeEventListener("resize", updateDeviceInfo)
  }, [])

  return deviceInfo
}

/**
 * Utility function to check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Detect orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape")
    }

    updateOrientation()
    window.addEventListener("resize", updateOrientation)
    window.addEventListener("orientationchange", updateOrientation)

    return () => {
      window.removeEventListener("resize", updateOrientation)
      window.removeEventListener("orientationchange", updateOrientation)
    }
  }, [])

  return orientation
}
