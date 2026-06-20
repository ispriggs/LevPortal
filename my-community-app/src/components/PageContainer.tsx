import type { ReactNode, CSSProperties } from 'react'

/**
 * Safe content container. Wrap all interactive page content in this.
 * Keeps text, buttons, and forms away from device notches and screen edges.
 * Background fills happen outside this component.
 */
export default function PageContainer({
  children,
  className = '',
  style,
  noTop,
  noBottom,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  noTop?: boolean
  noBottom?: boolean
}) {
  return (
    <div
      className={`w-full mx-auto ${className}`}
      style={{
        maxWidth: '1200px',
        paddingLeft:   'max(16px, env(safe-area-inset-left))',
        paddingRight:  'max(16px, env(safe-area-inset-right))',
        paddingTop:    noTop    ? undefined : 'max(16px, env(safe-area-inset-top))',
        paddingBottom: noBottom ? undefined : 'max(16px, env(safe-area-inset-bottom))',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
