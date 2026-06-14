import { ButtonComponent } from 'obsidian'
import { useEffect, useRef, useState } from 'react'

import { useObsidianSetting } from './ObsidianSetting'

type ObsidianButtonProps = {
  text?: string
  icon?: string
  tooltip?: string
  onClick: () => void
  cta?: boolean
  warning?: boolean
  disabled?: boolean
}

export function ObsidianButton({
  text,
  icon,
  tooltip,
  onClick,
  cta,
  warning,
  disabled,
}: ObsidianButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setting } = useObsidianSetting()
  const [buttonComponent, setButtonComponent] =
    useState<ButtonComponent | null>(null)
  const onClickRef = useRef(onClick)

  useEffect(() => {
    if (setting) {
      let newButtonComponent: ButtonComponent | null = null
      setting.addButton((component) => {
        newButtonComponent = component
      })
      setButtonComponent(newButtonComponent)

      return () => {
        newButtonComponent?.buttonEl.remove()
      }
    } else if (containerRef.current) {
      const newButtonComponent = new ButtonComponent(containerRef.current)
      setButtonComponent(newButtonComponent)

      return () => {
        newButtonComponent?.buttonEl.remove()
      }
    }
  }, [setting])

  useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  useEffect(() => {
    if (!buttonComponent) return
    buttonComponent.onClick(() => onClickRef.current())
  }, [buttonComponent])

  useEffect(() => {
    if (!buttonComponent) return

    if (text) buttonComponent.setButtonText(text)
    if (icon) buttonComponent.setIcon(icon)
    if (tooltip) buttonComponent.setTooltip(tooltip)
    if (cta) buttonComponent.setCta()
    // eslint-disable-next-line obsidianmd/prefer-destructive-button -- setDestructive not available in obsidian@1.11.4
    if (warning) buttonComponent.setWarning()
    buttonComponent.setDisabled(!!disabled)
  }, [buttonComponent, text, icon, tooltip, cta, warning, disabled])

  return <div ref={containerRef} />
}
