// ─── Data ────────────────────────────────────────────────────────────────────
let spans   = JSON.parse(localStorage.getItem("spans")   || "[]");
let meters  = JSON.parse(localStorage.getItem("meters")  || "[]");

// ─── Regex helpers ────────────────────────────────────────────────────────────
const intRegex      = /^[0-9]+(,[0-9]+)*$/;
const meterRegex    = /^[A-Za-z0-9]{6}$/;      // 6-character alphanumeric meter number
const poleRegex     = /^[0-9]+$/;              // single integer pole number
const distanceRegex = /^\d+(\.\d+)?$/;         // positive number, optional decimal

// ─── SPAN FORM ────────────────────────────────────────────────────────────────
function addSpan(event) {
    if (event) event.preventDefault();

    const sourceEl  = document.getElementById("spanSource");
    const destEl    = document.getElementById("spanDest");
    const distEl    = document.getElementById("spanDistance");
    const phaseEl   = document.getElementById("spanPhase");

    const source      = sourceEl.value.trim();
    const destination = destEl.value.trim();
    const distance    = distEl.value.trim();
    const phases      = Array.from(phaseEl.querySelectorAll("input[type=checkbox]:checked"))
                             .map(cb => cb.value);

    // Required fields
    if (!source || !destination || !distance) {
        alert("Source Pole, Destination Pole, and Distance are required.");
        return;
    }

    // Validate source (single integer)
    if (!poleRegex.test(source)) {
        alert("Source Pole must be a single integer (e.g. 3).");
        sourceEl.classList.add("custom-invalid");
        return;
    }

    // Validate destination (single integer)
    if (!poleRegex.test(destination)) {
        alert("Destination Pole must be a single integer (e.g. 4).");
        destEl.classList.add("custom-invalid");
        return;
    }

    // Source ≠ Destination
    if (source === destination) {
        alert("Source and Destination poles cannot be the same.");
        sourceEl.classList.add("custom-invalid");
        destEl.classList.add("custom-invalid");
        return;
    }

    // Duplicate span check (A→B and B→A are treated as the same span)
    const isDuplicate = spans.some(s =>
        (s.source === source && s.destination === destination) ||
        (s.source === destination && s.destination === source)
    );
    if (isDuplicate) {
        alert(`A span between Pole ${source} and Pole ${destination} already exists.`);
        sourceEl.classList.add("custom-invalid");
        destEl.classList.add("custom-invalid");
        return;
    }

    // Validate distance
    if (!distanceRegex.test(distance) || parseFloat(distance) <= 0) {
        alert("Distance must be a positive number (e.g. 27.5).");
        distEl.classList.add("custom-invalid");
        return;
    }

    // At least one phase
    if (phases.length === 0) {
        alert("Please select at least one Phase.");
        return;
    }

    const entry = {
        source,
        destination,
        distance: parseFloat(distance),
        phase: phases.join(", ")
    };

    spans.push(entry);
    localStorage.setItem("spans", JSON.stringify(spans));
    renderSpansTable();
    clearSpanForm();
}

function clearSpanForm() {
    document.getElementById("spanSource").value    = "";
    document.getElementById("spanDest").value      = "";
    document.getElementById("spanDistance").value  = "";
    document.querySelectorAll("#spanPhase input[type=checkbox]")
            .forEach(cb => cb.checked = false);
    ["spanSource","spanDest","spanDistance"].forEach(id =>
        document.getElementById(id).classList.remove("custom-invalid"));
}

function renderSpansTable() {
    const tbody = document.querySelector("#spansTable tbody");
    tbody.innerHTML = "";
    spans.forEach((s, i) => {
        tbody.innerHTML += `<tr>
            <td>${s.distance}</td>
            <td>${s.source}</td>
            <td>${s.destination}</td>
            <td>${s.phase}</td>
            <td><button type="button" class="del-btn" onclick="deleteSpan(${i})">✕</button></td>
        </tr>`;
    });
}

function deleteSpan(index) {
    if (confirm("Delete this span entry?")) {
        spans.splice(index, 1);
        localStorage.setItem("spans", JSON.stringify(spans));
        renderSpansTable();
    }
}

// ─── METER FORM ───────────────────────────────────────────────────────────────
function addMeter(event) {
    if (event) event.preventDefault();

    const meterNumEl  = document.getElementById("meterNumber");
    const meterPoleEl = document.getElementById("meterPole");
    const meterPhaseEl= document.getElementById("meterPhase");

    const meterNum  = meterNumEl.value.trim();
    const meterPole = meterPoleEl.value.trim();
    const meterPhase= meterPhaseEl.value;

    // Required fields
    if (!meterNum || !meterPole || !meterPhase) {
        alert("Meter Number, Pole Number, and Phase are all required.");
        return;
    }

    // Validate meter number (6 digits)
    if (!meterRegex.test(meterNum)) {
        alert("Meter Number must be exactly 6 alphanumeric characters (e.g. 550189 or AB1234).");
        meterNumEl.classList.add("custom-invalid");
        return;
    }

    // Validate pole number (integer)
    if (!poleRegex.test(meterPole)) {
        alert("Pole Number must be an integer (e.g. 9).");
        meterPoleEl.classList.add("custom-invalid");
        return;
    }

    // Duplicate meter check
    if (meters.some(m => m.meterNum === meterNum)) {
        alert(`Meter number ${meterNum} has already been recorded.`);
        meterNumEl.classList.add("custom-invalid");
        return;
    }

    const entry = { meterNum, meterPole, meterPhase };
    meters.push(entry);
    localStorage.setItem("meters", JSON.stringify(meters));
    renderMetersTable();
    clearMeterForm();
}

function clearMeterForm() {
    document.getElementById("meterNumber").value = "";
    document.getElementById("meterPole").value   = "";
    document.getElementById("meterPhase").value  = "";
    ["meterNumber","meterPole"].forEach(id =>
        document.getElementById(id).classList.remove("custom-invalid"));
}

function renderMetersTable() {
    const tbody = document.querySelector("#metersTable tbody");
    tbody.innerHTML = "";
    meters.forEach((m, i) => {
        tbody.innerHTML += `<tr>
            <td>${m.meterNum}</td>
            <td>${m.meterPole}</td>
            <td>${m.meterPhase}</td>
            <td><button type="button" class="del-btn" onclick="deleteMeter(${i})">✕</button></td>
        </tr>`;
    });
}

function deleteMeter(index) {
    if (confirm("Delete this meter entry?")) {
        meters.splice(index, 1);
        localStorage.setItem("meters", JSON.stringify(meters));
        renderMetersTable();
    }
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function escapeCSV(value) {
    if (value === null || value === undefined) return "";
    value = String(value);
    if (/^\d+(\,\d+)*$/.test(value) || value.includes(",") || value.includes('"') ||
        /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(value)) {
        return `"=""${value.replace(/"/g, '""')}"""`;
    }
    return value;
}

function exportCSV() {
    const projectName = document.getElementById("projectName").value.trim();
    if (!projectName) {
        alert("Please select a project name before exporting.");
        return;
    }
    if (spans.length === 0 && meters.length === 0) {
        alert("No data to export.");
        return;
    }

    let csv = "";

    // Spans section
    if (spans.length > 0) {
        csv += "SPANS\n";
        csv += "Distance (Km),Source,Destination,Phase Between\n";
        spans.forEach(s => {
            csv += [
                escapeCSV(s.distance),
                escapeCSV(s.source),
                escapeCSV(s.destination),
                escapeCSV(s.phase)
            ].join(",") + "\n";
        });
        csv += "\n";
    }

    // Meters section
    if (meters.length > 0) {
        csv += "METERS\n";
        csv += "Meter Number,Pole Number,Phase\n";
        meters.forEach(m => {
            csv += [
                escapeCSV(m.meterNum),
                escapeCSV(m.meterPole),
                escapeCSV(m.meterPhase)
            ].join(",") + "\n";
        });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${projectName}.csv`);

    if (confirm("CSV exported successfully. Clear all data to start a new project?")) {
        clearAllData();
    }
}

function clearAllData() {
    spans  = [];
    meters = [];
    localStorage.removeItem("spans");
    localStorage.removeItem("meters");
    document.querySelector("#spansTable tbody").innerHTML  = "";
    document.querySelector("#metersTable tbody").innerHTML = "";
    document.getElementById("projectName").value = "";
    clearSpanForm();
    clearMeterForm();
}

function deleteAllData() {
    if (confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
        clearAllData();
    }
}

// ─── Remove custom-invalid on user input ─────────────────────────────────────
["spanSource","spanDest","spanDistance","meterNumber","meterPole"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => el.classList.remove("custom-invalid"));
});

// ─── Init ─────────────────────────────────────────────────────────────────────
renderSpansTable();
renderMetersTable();




// let poles = JSON.parse(localStorage.getItem("poles") || "[]");

// // function getLocation() {
// //     if (navigator.geolocation) {
// //         navigator.geolocation.getCurrentPosition((pos) => {
// //             document.getElementById("latitude").value = pos.coords.latitude;
// //             document.getElementById("longitude").value = pos.coords.longitude;
// //         }, (err) => {
// //             alert("Error getting location: " + err.message);
// //         });
// //     } else {
// //         alert("Geolocation not supported.");
// //     }
// // }

// function getLocation() {
//     if (navigator.geolocation) {
//         alert("Waiting 20 seconds for GPS to stabilize...");

//         setTimeout(() => {
//             navigator.geolocation.getCurrentPosition((pos) => {
//                 document.getElementById("latitude").value = pos.coords.latitude;
//                 document.getElementById("longitude").value = pos.coords.longitude;
//                 // alert("Coordinates recorded after 20s delay.");
//             }, (err) => {
//                 alert("Error getting location: " + err.message);
//             });
//         }, 20000); // 120 seconds 120000
//     } else {
//         alert("Geolocation not supported.");
//     }
// }



// function addPole(event) {
//     if (event) event.preventDefault();
//     let poleNumber = document.getElementById("poleNumber").value.trim();
//     let lat = document.getElementById("latitude").value;
//     let lon = document.getElementById("longitude").value;
//     // let source = document.getElementById("sourcePole").value.trim();
//     // let destination = document.getElementById("destinationPole").value.trim();
//     let sourceEl = document.getElementById("sourcePole");
//     let destEl = document.getElementById("destinationPole");

//     let source = sourceEl.value.trim();
//     let destination = destEl.value.trim()

//     let customers = document.getElementById("customersID").value.trim();

//     // Required fields check
//     if (!poleNumber || !lat || !lon) {
//         alert("Please fill Pole Number and get location before adding.");
//         return; // stop here, form is NOT cleared
//     }

//     // Regex validators  /^[0-9]+$/ 
//     const intRegex = /^[0-9]+(,[0-9]+)*$/; 
//     const custRegex = /^[A-Za-z0-9]{6}(,[A-Za-z0-9]{6})*$/;  //allows comma seperated integers

//     // Validate Pole Number (required)
//     if (!intRegex.test(poleNumber)) {
//         alert("Pole Number must be an integer.");
//         return;
//     }

//     // Validate Source Pole (optional)
//     if (source && !intRegex.test(source)) {
//         alert("Source Pole must be an integer.");
//         return;
//     }

//     // Validate Destination Pole (optional)
//     if (destination && !intRegex.test(destination)) {
//         alert("Destination Pole must be an integer.");
//         return;
//     }

//     // Validate Customer IDs (optional)
//     if (customers && !custRegex.test(customers)) {
//         alert(
//             "Invalid Customer IDs.\n" +
//             "Rules:\n" +
//             "- Each ID must be exactly 6 alphanumeric characters\n" +
//             "- Multiple IDs must be separated only by a comma (no spaces)\n" +
//             "Example: ND4567,ND3456"
//         );
//         return;
//     }

//     //  // validation: source and destination must not overlap
//     // if (source && destination) {
//     //     let sourceVal = source.trim();
//     //     let destList = destination.split(",").map(d => d.trim());

//     //     if (destList.includes(sourceVal)) {
//     //         alert("Source pole cannot also appear in Destination pole(s).");
//     //         return;
//     //     }
//     // }

//      // Overlap validation
//     if (source && destination) {
//         let destList = destination.split(",").map(d => d.trim());
//         let sourceVal = source.trim();
//         if (destList.includes(sourceVal)) {
//             // Mark both fields invalid
//             sourceEl.classList.add("custom-invalid");
//             destEl.classList.add("custom-invalid");
//             alert("Source pole cannot also appear in Destination pole(s).");
//             return;
//         }
//     }

//     // Warn if any optional field is missing
//     if (!source || !destination || !customers) {
//         let missing = [];
//         if (!source) missing.push("Source Pole");
//         if (!destination) missing.push("Destination Pole");
//         if (!customers) missing.push("Customer IDs");

//         let msg = "The following optional fields are empty:\n- " + missing.join("\n- ");
//         msg += "\n\nDo you want to save anyway?";

//         if (!confirm(msg)) {
//             return; // stop if user cancels, form is NOT cleared
//         }
//     }

//     // ✅ If we get here, all validation passed or user confirmed missing fields
//     let entry = { poleNumber, lat, lon, source, destination, customers };
//     poles.push(entry);
//     localStorage.setItem("poles", JSON.stringify(poles));
//     renderTable();

//     // Clear form only after successful save
//     clearForm();
// }



// function clearForm() {
//     document.getElementById("poleNumber").value = "";
//     document.getElementById("sourcePole").value = "";
//     document.getElementById("destinationPole").value = "";
//     document.getElementById("latitude").value = "";
//     document.getElementById("longitude").value = "";
//     document.getElementById("customersID").value = "";
// }

// function renderTable() {
//     let tbody = document.querySelector("#polesTable tbody");
//     tbody.innerHTML = "";
//     poles.forEach(p => {
//         let row = `<tr>
//             <td>${p.poleNumber}</td>
//             <td>${p.lat}</td>
//             <td>${p.lon}</td>
//             <td>${p.source}</td>
//             <td>${p.destination}</td>
//             <td>${p.customers}</td>
//         </tr>`;
//         tbody.innerHTML += row;
//     });
// }


// function escapeCSV(value) {
//     if (value === null || value === undefined) return "";
//     value = String(value);

//     // Always quote if:
//     // 1. It contains a comma
//     // 2. It contains quotes
//     // 3. It is purely numeric (with optional commas)
//     // 4. It looks like a date (to prevent Excel auto-formatting)
//     if (/^\d+(\,\d+)*$/.test(value) || value.includes(",") || value.includes('"') || /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(value)) {
//         // Option 1: Just quote to preserve as string
//         // return `"${value.replace(/"/g, '""')}"`;

//         // Option 2 (safer for Excel): Force as text
//         return `"=""${value.replace(/"/g, '""')}"""`;
//     }
//     return value;
// }

// function exportCSV() {
//     let projectName = document.getElementById("projectName").value.trim();
//     if (!projectName) {
//         alert("Enter project name first!");
//         return;
//     }

//     let headers = ["Pole Number", "Latitude", "Longitude", "Source", "Destination", "Customers"];
//     let rows = poles.map(p => [
//         (p.poleNumber),
//         (p.lat),
//         (p.lon),
//         (p.source),
//         escapeCSV(p.destination),
//         escapeCSV(p.customers)
//     ]);

//     let csvContent = headers.join(",") + "\n" +
//         rows.map(r => r.join(",")).join("\n");

//     let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     saveAs(blob, `${projectName}.csv`);

//     // Ask before clearing
//     if (confirm("CSV exported successfully. Clear all data to start a new project?")) {
//         poles = [];
//         localStorage.removeItem("poles");
//         document.querySelector("#polesTable tbody").innerHTML = "";
//         document.getElementById("projectName").value = "";
//         clearForm();
//     }
// }

// function deleteTable(){
//     if (confirm("Are you sure you want to delete all data from the table? This action cannot be undone.")){
//         poles = [];
//         localStorage.removeItem("poles");
//         document.querySelector("#polesTable tbody").innerHTML = "";
//         document.getElementById("projectName").value = "";
//         clearForm();
//     }
// }

// renderTable();

// ["sourcePole", "destinationPole"].forEach(id => {
//     document.getElementById(id).addEventListener("input", (e) => {
//         e.target.classList.remove("custom-invalid");
//     });
// });

