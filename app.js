let poles = JSON.parse(localStorage.getItem("poles") || "[]");

// function getLocation() {
//     if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition((pos) => {
//             document.getElementById("latitude").value = pos.coords.latitude;
//             document.getElementById("longitude").value = pos.coords.longitude;
//         }, (err) => {
//             alert("Error getting location: " + err.message);
//         });
//     } else {
//         alert("Geolocation not supported.");
//     }
// }

function getLocation() {
    if (navigator.geolocation) {
        alert("Waiting 20 seconds for GPS to stabilize...");

        setTimeout(() => {
            navigator.geolocation.getCurrentPosition((pos) => {
                document.getElementById("latitude").value = pos.coords.latitude;
                document.getElementById("longitude").value = pos.coords.longitude;
                // alert("Coordinates recorded after 20s delay.");
            }, (err) => {
                alert("Error getting location: " + err.message);
            });
        }, 20000); // 20 seconds
    } else {
        alert("Geolocation not supported.");
    }
}



function addPole(event) {
    if (event) event.preventDefault();
    let poleNumber = document.getElementById("poleNumber").value.trim();
    let lat = document.getElementById("latitude").value;
    let lon = document.getElementById("longitude").value;
    let source = document.getElementById("sourcePole").value.trim();
    let destination = document.getElementById("destinationPole").value.trim();
    let customers = document.getElementById("customersID").value.trim();

    // Required fields check
    if (!poleNumber || !lat || !lon) {
        alert("Please fill Pole Number and get location before adding.");
        return; // stop here, form is NOT cleared
    }

    // Regex validators
    const intRegex = /^[0-9]+$/; 
    const custRegex = /^[A-Za-z0-9]{6}(,[A-Za-z0-9]{6})*$/; 

    // Validate Pole Number (required)
    if (!intRegex.test(poleNumber)) {
        alert("Pole Number must be an integer.");
        return;
    }

    // Validate Source Pole (optional)
    if (source && !intRegex.test(source)) {
        alert("Source Pole must be an integer.");
        return;
    }

    // Validate Destination Pole (optional)
    if (destination && !intRegex.test(destination)) {
        alert("Destination Pole must be an integer.");
        return;
    }

    // Validate Customer IDs (optional)
    if (customers && !custRegex.test(customers)) {
        alert(
            "Invalid Customer IDs.\n" +
            "Rules:\n" +
            "- Each ID must be exactly 6 alphanumeric characters\n" +
            "- Multiple IDs must be separated only by a comma (no spaces)\n" +
            "Example: ND4567,ND3456"
        );
        return;
    }

    // Warn if any optional field is missing
    if (!source || !destination || !customers) {
        let missing = [];
        if (!source) missing.push("Source Pole");
        if (!destination) missing.push("Destination Pole");
        if (!customers) missing.push("Customer IDs");

        let msg = "The following optional fields are empty:\n- " + missing.join("\n- ");
        msg += "\n\nDo you want to save anyway?";

        if (!confirm(msg)) {
            return; // stop if user cancels, form is NOT cleared
        }
    }

    // ✅ If we get here, all validation passed or user confirmed missing fields
    let entry = { poleNumber, lat, lon, source, destination, customers };
    poles.push(entry);
    localStorage.setItem("poles", JSON.stringify(poles));
    renderTable();

    // Clear form only after successful save
    clearForm();
}



function clearForm() {
    document.getElementById("poleNumber").value = "";
    document.getElementById("sourcePole").value = "";
    document.getElementById("destinationPole").value = "";
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
    document.getElementById("customersID").value = "";
}

function renderTable() {
    let tbody = document.querySelector("#polesTable tbody");
    tbody.innerHTML = "";
    poles.forEach(p => {
        let row = `<tr>
            <td>${p.poleNumber}</td>
            <td>${p.lat}</td>
            <td>${p.lon}</td>
            <td>${p.source}</td>
            <td>${p.destination}</td>
            <td>${p.customers}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}


function escapeCSV(value) {
    if (value === null || value === undefined) return "";
    value = String(value);

    // Always quote if:
    // 1. It contains a comma
    // 2. It contains quotes
    // 3. It is purely numeric (with optional commas)
    // 4. It looks like a date (to prevent Excel auto-formatting)
    if (/^\d+(\,\d+)*$/.test(value) || value.includes(",") || value.includes('"') || /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(value)) {
        // Option 1: Just quote to preserve as string
        // return `"${value.replace(/"/g, '""')}"`;

        // Option 2 (safer for Excel): Force as text
        return `"=""${value.replace(/"/g, '""')}"""`;
    }
    return value;
}

function exportCSV() {
    let projectName = document.getElementById("projectName").value.trim();
    if (!projectName) {
        alert("Enter project name first!");
        return;
    }

    let headers = ["Pole Number", "Latitude", "Longitude", "Source", "Destination", "Customers"];
    let rows = poles.map(p => [
        (p.poleNumber),
        (p.lat),
        (p.lon),
        (p.source),
        escapeCSV(p.destination),
        escapeCSV(p.customers)
    ]);

    let csvContent = headers.join(",") + "\n" +
        rows.map(r => r.join(",")).join("\n");

    let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${projectName}.csv`);

    // Ask before clearing
    if (confirm("CSV exported successfully. Clear all data to start a new project?")) {
        poles = [];
        localStorage.removeItem("poles");
        document.querySelector("#polesTable tbody").innerHTML = "";
        document.getElementById("projectName").value = "";
        clearForm();
    }
}

function deleteTable(){
    if (confirm("Are you sure you want to delete all data from the table? This action cannot be undone.")){
        poles = [];
        localStorage.removeItem("poles");
        document.querySelector("#polesTable tbody").innerHTML = "";
        document.getElementById("projectName").value = "";
        clearForm();
    }
}

renderTable();
