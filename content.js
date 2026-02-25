(function() {
    const skema = document.querySelector("#s_m_Content_Content_SkemaMedNavigation_skemaprintarea")
    var s2infoHeader = document.querySelector(".s2infoHeader.s2skemabrikcontainer");
    var s2dayHeader = document.querySelector(".s2dayHeader");
    

    if (skema) {

        var DefineEndpixel = [...document.querySelectorAll(".s2time")]
            .find(e => e.textContent.trim() === "18:00");
        const startHour = 7;
        const startMinute = 0;
        const endHour = 18;
        const endMinute = 0;
        var startPixel = 35 + s2infoHeader.getBoundingClientRect().height + s2dayHeader.getBoundingClientRect().height;
        console.log(
            "startPixel = ",startPixel,
            "35 + ",
            "s2infoHeader ", s2infoHeader.getBoundingClientRect().height,
            "+ s2dayheader ", s2dayHeader.getBoundingClientRect().height
        )
        if (DefineEndpixel){
            //var endPixel = 41 - startPixel + DefineEndpixel.getBoundingClientRect().y - s2infoHeader.getBoundingClientRect().y; //41
            var endPixel = skema.getBoundingClientRect().height - s2infoHeader.getBoundingClientRect().height - s2dayHeader.getBoundingClientRect().height + 55;
            console.log(
                "endPixel = ",endPixel,
                "startPixel ", startPixel,
                "+ DefineEndpixel ", DefineEndpixel.getBoundingClientRect().y,
                "- s2infoheader ", s2infoHeader.getBoundingClientRect().y,
                "- 41 - 70"
            )
        } else {
            var endPixel = startPixel + 548.366 - 41;
            console.log(
                "endPixel = ", endPixel,
                "+ 548.366 - 41"
            )
        }
        totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        var totalPixels = endPixel - startPixel;
        console.log(totalPixels)
        var pixelsPerMinute = totalPixels / totalMinutes;

        const tidspunkt = document.createElement("div");
        tidspunkt.id = "tidspunkt";
        tidspunkt.style.position = "absolute";
        tidspunkt.style.width = "96.777%";
        tidspunkt.style.height = "100%";
        tidspunkt.style.height = "1.5px";
        tidspunkt.style.zIndex = "90";
        tidspunkt.style.backgroundColor = "red";
        tidspunkt.style.pointerEvents = "none";
        tidspunkt.style.opacity = "0.5";
    

        skema.style.position = "relative";
        skema.appendChild(tidspunkt);
        

        function updateLine() {
            const now = new Date();
            const nowMinutes = 
                //now.getHours() 
                10
                * 60 + 
                0
                //now.getMinutes();
            
            const startMinutes = startHour * 60 + startMinute;
            

            let minutesSinceStart = nowMinutes - startMinutes;
            if (minutesSinceStart < 0) minutesSinceStart = 0;
            if (minutesSinceStart > totalMinutes) minutesSinceStart = totalMinutes;
        
            const offset = startPixel + minutesSinceStart * pixelsPerMinute;
            tidspunkt.style.top = offset + "px";        
        
            if (parseFloat(tidspunkt.style.top.replace(/[^0-9.]/g,'')) >= skema.getBoundingClientRect().height - 15.26666) tidspunkt.style.position = ""; 
                else
                    tidspunkt.style.position = "absolute";
        }
        
        
        function dagenidag() {
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();
            var today = yyyy + "-" + mm + "-" + dd

            var dag = document.querySelector(`td[data-date="${today}"]`);
            if (dag) {
                dag.firstElementChild.style.backgroundColor = "#94b0f2";
                dag.style.backgroundColor = "#94b0f2";

                dag.querySelectorAll(".s2module-bg").forEach(el => {
                  el.style.display = "none";
            });
            }
                else {
                    //hvis brugeren kigger på uger tilbage, 
                    // eller frem i tiden, vil den ikke vise en dag
                }
        }

        dagenidag();
        updateLine();
        setInterval(updateLine, 60000); 
        setInterval(dagenidag, 60000);
    }


})();

