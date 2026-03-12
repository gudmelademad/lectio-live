(function() {
    const skema = document.querySelector("#s_m_Content_Content_SkemaMedNavigation_skemaprintarea");
    const timelineContainer = document.querySelector(".s2module-info")?.closest(".s2skemabrikcontainer");

    if (!skema || !timelineContainer) {
        return;
    }

    function toMinutes(timeText) {
        const match = timeText?.match(/(\d{1,2}):(\d{2})/);
        if (!match) return null;
        return Number(match[1]) * 60 + Number(match[2]);
    }

    function getCurrentIsoWeekAndYear() {
        const now = new Date();
        const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

        return `${String(weekNo).padStart(2, "0")}${date.getUTCFullYear()}`;
    }

    function shouldHighlightCurrentDay() {
        const currentUrl = new URL(window.location.href);
        const path = currentUrl.pathname.toLowerCase();
        const isSkemaPage = path.endsWith("/lectio/54/skemany.aspx");
        if (!isSkemaPage) {
            return false;
        }

        if (!currentUrl.search) {
            return true;
        }

        const weekParam = currentUrl.searchParams.get("week");
        return weekParam === getCurrentIsoWeekAndYear();
    }

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

    const parsedBounds = parseStartEndFromScript() || parseStartEndFromGridLabels() || {
        startMinutes: 7 * 60,
        endMinutes: 18 * 60
    };

    const startMinutes = parsedBounds.startMinutes;
    const endMinutes = parsedBounds.endMinutes;
    const totalMinutes = endMinutes - startMinutes;
    const highlightCurrentDay = shouldHighlightCurrentDay();

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

    skema.style.position = "relative";
    skema.appendChild(tidspunkt);

    function getGridPixels() {
        const skemaRect = skema.getBoundingClientRect();
        const gridRect = timelineContainer.getBoundingClientRect();

        const startPixel = gridRect.top - skemaRect.top;
        const endPixel = startPixel + gridRect.height;

        return { startPixel, endPixel };
    }

    function updateLine() {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const clampedMinutes = Math.max(startMinutes, Math.min(endMinutes, nowMinutes));
        const percentThroughDay = (clampedMinutes - startMinutes) / totalMinutes;

        const { startPixel, endPixel } = getGridPixels();
        const offset = startPixel + (endPixel - startPixel) * percentThroughDay;

        tidspunkt.style.top = `${offset}px`;
    }

    function dagenidag() {
        if (!highlightCurrentDay) {
            return;
        }

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

    dagenidag();
    updateLine();

    setInterval(updateLine, 60000);
    if (highlightCurrentDay) {
        setInterval(dagenidag, 60000);
    }
    window.addEventListener("resize", updateLine);
})();
