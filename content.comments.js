/*
 * This file is a commented companion to content.js.
 * It keeps the same behavior, but adds explanations for each step.
 */

(function() {
    // Main timetable wrapper where the red "current time" line is injected.
    const skema = document.querySelector("#s_m_Content_Content_SkemaMedNavigation_skemaprintarea");

    // The first module-info element sits inside the left time-column container.
    // We use that container as a stable vertical anchor for line positioning.
    const timelineContainer = document.querySelector(".s2module-info")?.closest(".s2skemabrikcontainer");

    // If required anchors are missing, do nothing to avoid runtime errors.
    if (!skema || !timelineContainer) {
        return;
    }

    // Convert "HH:MM" text to absolute minutes from midnight.
    function toMinutes(timeText) {
        const match = timeText?.match(/(\d{1,2}):(\d{2})/);
        if (!match) return null;
        return Number(match[1]) * 60 + Number(match[2]);
    }

    // Preferred source: parse start/end day bounds from Lectio's inline script values.
    // Example in page script:
    //   SkemaStartTime: new Date(..., 8, 0, 0)
    //   SkemaEndTime:   new Date(..., 18, 0, 0)
    function parseStartEndFromScript() {
        const scriptsText = Array.from(document.scripts)
            .map((script) => script.textContent || "")
            .join("\n");

        const startMatch = scriptsText.match(
            /SkemaStartTime:\s*new Date\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})/
        );
        const endMatch = scriptsText.match(
            /SkemaEndTime:\s*new Date\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})/
        );

        if (!startMatch || !endMatch) {
            return null;
        }

        return {
            startMinutes: Number(startMatch[1]) * 60 + Number(startMatch[2]),
            endMinutes: Number(endMatch[1]) * 60 + Number(endMatch[2])
        };
    }

    // Fallback source: derive day bounds from visible labels in the table.
    // - Start: first module start time (e.g. "8:10")
    // - End: max(last module end, right-side time marks like 18:00/20:00)
    function parseStartEndFromGridLabels() {
        const moduleRanges = Array.from(document.querySelectorAll(".s2module-info"))
            .map((el) => el.textContent || "")
            .map((text) => text.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/))
            .filter(Boolean);

        const firstModuleStart = moduleRanges.length > 0 ? toMinutes(moduleRanges[0][1]) : null;
        const lastModuleEnd = moduleRanges.length > 0 ? toMinutes(moduleRanges[moduleRanges.length - 1][2]) : null;

        const sideTimeMarks = Array.from(document.querySelectorAll(".s2time"))
            .map((el) => toMinutes((el.textContent || "").trim()))
            .filter((v) => Number.isFinite(v));

        const latestSideMark = sideTimeMarks.length > 0 ? Math.max(...sideTimeMarks) : null;
        const endMinutes = Math.max(lastModuleEnd ?? 0, latestSideMark ?? 0);

        if (!Number.isFinite(firstModuleStart) || !Number.isFinite(endMinutes) || endMinutes <= firstModuleStart) {
            return null;
        }

        return {
            startMinutes: firstModuleStart,
            endMinutes
        };
    }

    // Choose bounds in this priority order:
    // 1) Script-derived values
    // 2) Label-derived fallback
    // 3) Safe default (07:00 -> 18:00)
    const parsedBounds = parseStartEndFromScript() || parseStartEndFromGridLabels() || {
        startMinutes: 7 * 60,
        endMinutes: 18 * 60
    };

    const startMinutes = parsedBounds.startMinutes;
    const endMinutes = parsedBounds.endMinutes;
    const totalMinutes = endMinutes - startMinutes;

    // Build the red timeline line element.
    const tidspunkt = document.createElement("div");
    tidspunkt.id = "tidspunkt";
    tidspunkt.style.position = "absolute";
    tidspunkt.style.left = "0";
    tidspunkt.style.width = "100%";
    tidspunkt.style.height = "1.5px";
    tidspunkt.style.zIndex = "90";
    tidspunkt.style.backgroundColor = "red";
    tidspunkt.style.pointerEvents = "none";
    tidspunkt.style.opacity = "0.5";

    // Ensure relative positioning so the line can be absolutely positioned inside.
    skema.style.position = "relative";
    skema.appendChild(tidspunkt);

    // Compute dynamic pixel range for the visible timetable grid.
    // This avoids hardcoded offsets and adapts to week layout differences.
    function getGridPixels() {
        const skemaRect = skema.getBoundingClientRect();
        const gridRect = timelineContainer.getBoundingClientRect();

        const startPixel = gridRect.top - skemaRect.top;
        const endPixel = startPixel + gridRect.height;

        return { startPixel, endPixel };
    }

    // Move the line based on current clock time mapped proportionally onto grid height.
    function updateLine() {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        // Keep line within the configured timetable range.
        const clampedMinutes = Math.max(startMinutes, Math.min(endMinutes, nowMinutes));
        const percentThroughDay = (clampedMinutes - startMinutes) / totalMinutes;

        const { startPixel, endPixel } = getGridPixels();
        const offset = startPixel + (endPixel - startPixel) * percentThroughDay;

        tidspunkt.style.top = `${offset}px`;
    }

    // Keep the existing behavior that highlights today's column (if the shown week contains today).
    function dagenidag() {
        const todayDate = new Date();
        const dd = String(todayDate.getDate()).padStart(2, "0");
        const mm = String(todayDate.getMonth() + 1).padStart(2, "0");
        const yyyy = todayDate.getFullYear();
        const today = `${yyyy}-${mm}-${dd}`;

        const dag = document.querySelector(`td[data-date="${today}"]`);
        if (dag) {
            dag.firstElementChild.style.backgroundColor = "#94b0f2";
            dag.style.backgroundColor = "#94b0f2";

            dag.querySelectorAll(".s2module-bg").forEach((el) => {
                el.style.display = "none";
            });
        }
    }

    // Initial paint.
    dagenidag();
    updateLine();

    // Keep data fresh as time and layout change.
    setInterval(updateLine, 60000);
    setInterval(dagenidag, 60000);
    window.addEventListener("resize", updateLine);
})();
