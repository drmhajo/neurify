export function createResponsiveLayout(width: number, height: number) {
  const isCompact = width < 360;
  const isShort = height < 680;

  return {
    isCompact,
    isShort,
    screenPadding: isCompact ? 14 : Math.min(22, Math.max(16, Math.round(width * 0.05))),
    contentBottomPadding: isShort ? 24 : 32,
    itemGap: isCompact ? 8 : 10,
    cardPadding: isCompact ? 14 : 16,
    loginTopPadding: isShort ? 42 : 58,
    loginHeaderHeight: isShort ? 270 : 292,
    loginLogoSize: isCompact ? 106 : 124,
    loginLogoRadius: isCompact ? 28 : 32,
    loginTitleSize: isCompact ? 22 : 24,
    loginWordmarkWidth: isCompact ? 96 : 106,
    loginWordmarkHeight: isCompact ? 30 : 32,
    tabHeight: isCompact ? 58 : 64,
    tabLabelSize: isCompact ? 8 : 10,
    tabIconSize: isCompact ? 22 : 24,
  };
}
