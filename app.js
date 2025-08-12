let poles = JSON.parse(localStorage.getItem("poles") || "[]");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById("latitude").value = pos.coords.latitude;
            document.getElementById("longitude").value = pos.coords.longitude;
        }, (err) => {
            alert("Error getting location: " + err.message);
        });
    } else {
        alert("Geolocation not supported.");
    }
}

function addPole() {
    let poleNumber = document.getElementById("poleNumber").value.trim();
    let lat = document.getElementById("latitude").value;
    let lon = document.getElementById("longitude").value;
    let source = document.getElementById("sourcePole").value.trim();
    let destination = document.getElementById("destinationPole").value.trim();
    let customers = document.getElementById("customersID").value.trim();

    if (!poleNumber || !lat || !lon) {
        alert("Please fill Pole Number and get location before adding.");
        return;
    }

    let entry = { poleNumber, lat, lon, source, destination,customers };
    poles.push(entry);
    localStorage.setItem("poles", JSON.stringify(poles));
    renderTable();
    clearForm();
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

function clearForm() {
    document.getElementById("poleNumber").value = "";
    document.getElementById("sourcePole").value = "";
    document.getElementById("destinationPole").value = "";
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
    document.getElementById("customersID").value = "";
}

// function exportCSV() {
//     let projectName = document.getElementById("projectName").value.trim();
//     if (!projectName) {
//         alert("Enter project name first!");
//         return;
//     }

//     let csvContent = "Pole Number,Latitude,Longitude,Source,Destination, Customers\n" +
//         poles.map(p => `${p.poleNumber},${p.lat},${p.lon},${p.source},${p.destination},${p.customers}`).join("\n");

//     let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     saveAs(blob, `${projectName}.csv`);
// }

// function escapeCSV(value) {
//     if (value === null || value === undefined) return "";
//     value = String(value);
//     if (value.includes(",") || value.includes('"')) {
//         return `"${value.replace(/"/g, '""')}"`; // escape internal quotes
//     }
//     return value;
// }

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


renderTable();
