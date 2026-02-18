/**
 * Hook that reads share data from URL on mount.
 * If URL contains compressed expression data, loads it into the editor.
 */

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { decodeShareUrl } from "@/lib/utils/lz-url";

export function useUrlSharing() {
  useEffect(() => {
    const shareData = decodeShareUrl();
    if (shareData) {
      useEditorStore.getState().setExpression(shareData.expression);
      if (shareData.input) {
        useEditorStore.getState().setInputJson(shareData.input);
      }
      // Clean URL without reload
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
}
