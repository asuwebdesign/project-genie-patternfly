import React from 'react'
import { NavExpandable as PFNavExpandable } from '@patternfly/react-core'
import type { NavExpandableProps as PFNavExpandableProps } from '@patternfly/react-core'

interface CustomNavExpandableProps extends Omit<PFNavExpandableProps, 'ref'> {
  /** Icon to display before the title */
  icon?: React.ReactNode
}

export const ExtendedNavExpandable: React.FC<CustomNavExpandableProps> = ({
  icon,
  title,
  children,
  ...props
}) => {
  const titleWithIcon = icon ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon}
      {title}
    </span>
  ) : (
    title
  )

  // Filter out any undefined/empty string props that might cause the inert warning
  const cleanProps = Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== '' && value !== undefined)
  )

  return (
    <PFNavExpandable title={titleWithIcon} {...cleanProps}>
      {children}
    </PFNavExpandable>
  )
}
