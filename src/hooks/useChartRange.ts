"use client";

import { useState } from "react";
import { DEFAULT_RANGE } from "@/lib/chart-utils";
import type { RangeLabel } from "@/lib/chart-utils";

/**
 * Manage a chart time-range that can be either internally or
 * externally controlled.
 *
 * When `externalRange` and `onRangeChange` are provided (e.g. from a
 * parent that syncs multiple charts), those are used.  Otherwise an
 * internal state is created so the hook works standalone too.
 *
 * @returns `[range, setRange]`
 */
export function useChartRange(
  externalRange?: RangeLabel,
  onRangeChange?: (range: RangeLabel) => void,
): [RangeLabel, (range: RangeLabel) => void] {
  const [internalRange, setInternalRange] =
    useState<RangeLabel>(DEFAULT_RANGE);

  const range = externalRange ?? internalRange;
  const setRange = onRangeChange ?? setInternalRange;

  return [range, setRange];
}
