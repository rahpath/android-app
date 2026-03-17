import { router } from "expo-router";

export type RahShellPath = "/home" | "/ask" | "/decision" | "/journey" | "/chart";

function safeDismissAll() {
  try {
    if (router.canDismiss()) {
      router.dismissAll();
    }
  } catch {
    // Some router states do not support dismissing; replace below is enough.
  }
}

export function enterRahSurface(path: RahShellPath = "/home") {
  safeDismissAll();
  router.replace(path);
}

export function navigateWithinRah(path: RahShellPath, currentPath?: string) {
  if (currentPath === path) {
    return;
  }

  router.replace(path);
}

export function getRahShellActivePath(pathname: string): RahShellPath {
  if (pathname.startsWith("/ask")) {
    return "/ask";
  }

  if (pathname.startsWith("/decision")) {
    return "/decision";
  }

  if (pathname.startsWith("/journey")) {
    return "/journey";
  }

  if (pathname.startsWith("/chart")) {
    return "/chart";
  }

  return "/home";
}
