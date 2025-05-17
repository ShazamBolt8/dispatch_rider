const ashStyle = {
  "--background": "#43454a",
  "--secondary-background": "#36393e",
  "--danger": "#da373c",
  "--danger-hover": "#a12828",
  "--danger-active": "#8f2022",
  "--btn-primary": "#5766f2",
  "--btn-primary-hover": "#4b5beb",
  "--btn-primary-active": "#3242cf",
  "--btn-primary-disabled": "#7885ff",
  "--btn-secondary": "#292b30",
  "--btn-secondary-hover": "#202225",
  "--btn-secondary-active": "#0b0c0e",
  "--btn-secondary-disabled": "#36393e",
  "--input": "#292b30",
  "--input-hover": "#212226",
  "--input-focus": "#0b0c10",
  "--list-even": "#202225",
  "--list-odd": "#282b30",
  "--list-hover": "#0b0c0e",
  "--success": "#06a151",
  "--error": "#eb2433",
  "--placeholder": "#6d6c76",
};

const darkStyle = {
  "--background": "#1a1a1e",
  "--secondary-background": "#121214",
  "--danger": "#e83c4f",
  "--danger-hover": "#a12828",
  "--danger-active": "#8f2022",
  "--btn-primary": "#6d54ef",
  "--btn-primary-hover": "#5748be",
  "--btn-primary-active": "#493ea1",
  "--btn-primary-disabled": "#504996",
  "--btn-secondary": "#29292d",
  "--btn-secondary-hover": "#333338",
  "--btn-secondary-active": "#2a2a30",
  "--btn-secondary-disabled": "#393a3f",
  "--input": "#222327",
  "--input-hover": "#222327",
  "--input-focus": "#222327",
  "--list-even": "#343639",
  "--list-odd": "#2b2e31",
  "--list-hover": "#0b0c0e",
  "--success": "#06a151",
  "--error": "#eb2433",
  "--placeholder": "#56565e",
};

const onyxStyle = {
  "--background": "#070709",
  "--secondary-background": "#121214",
  "--danger": "#e83c4f",
  "--danger-hover": "#a12828",
  "--danger-active": "#8f2022",
  "--btn-primary": "#6d54ef",
  "--btn-primary-hover": "#5748be",
  "--btn-primary-active": "#493ea1",
  "--btn-primary-disabled": "#504996",
  "--btn-secondary": "#18181b",
  "--btn-secondary-hover": "#242427",
  "--btn-secondary-active": "#2a2a30",
  "--btn-secondary-disabled": "#121213",
  "--input": "#131416",
  "--input-hover": "#131416",
  "--input-focus": "#131416",
  "--list-even": "#343639",
  "--list-odd": "#2b2e31",
  "--list-hover": "#0b0c0e",
  "--success": "#06a151",
  "--error": "#eb2433",
  "--placeholder": "#56565e",
};

const themes = {
  ash: ashStyle,
  dark: darkStyle,
  onyx: onyxStyle,
};

async function loadAndApplyTheme() {
  const { theme: themeName = "ash" } = await new Promise((resolve) => chrome.storage.session.get(["theme"], resolve));

  const theme = themes[themeName];
  if (!theme) return "ash";

  for (const [key, value] of Object.entries(theme)) {
    document.documentElement.style.setProperty(key, value);
  }

  return themeName;
}
function saveTheme(themeName) {
  chrome.storage.session.set({ theme: themeName });
}

export { loadAndApplyTheme, saveTheme };
