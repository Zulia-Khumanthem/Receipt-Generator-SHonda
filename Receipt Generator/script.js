document.addEventListener("DOMContentLoaded", function () {
  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;

  // Add item row
  document.getElementById("addItemBtn").addEventListener("click", addItemRow);

  // Generate receipt
  document
    .getElementById("generateBtn")
    .addEventListener("click", generateReceipt);

  // Download PDF
  document.getElementById("downloadBtn").addEventListener("click", downloadPDF);

  // WhatsApp share
  document
    .getElementById("whatsappBtn")
    .addEventListener("click", shareWhatsApp);

  // Helper function to format currency
  function formatCurrency(amount) {
    return "$" + parseFloat(amount).toFixed(2);
  }

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US");
  }

  // Add a new item row
  function addItemRow() {
    const itemsContainer = document.querySelector(".items-container");
    const newRow = document.createElement("div");
    newRow.className = "form-row item-row";
    newRow.innerHTML = `
            <div class="form-group" style="flex: 2;">
                <input type="text" class="item-desc" placeholder="Product or service">
            </div>
            <div class="form-group">
                <input type="number" class="item-qty" placeholder="1" min="1" value="1">
            </div>
            <div class="form-group">
                <input type="number" class="item-price" min="0" step="0.01">
            </div>
            <button class="remove-item" style="background: #e74c3c; align-self: flex-end; padding: 8px 12px;">×</button>
        `;
    itemsContainer.appendChild(newRow);

    // Add event listener for remove button
    newRow.querySelector(".remove-item").addEventListener("click", function () {
      itemsContainer.removeChild(newRow);
      const total = calculateTotalAmount();
      document.getElementById(
        "totalAMount"
      ).textContent = `Total Amount: $${total.toFixed(2)}`;
    });
  }

  function calculateTotalAmount() {
    let total = 0;
    const itemRows = document.querySelectorAll(".item-row");
    itemRows.forEach((row) => {
      const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
      const price = parseFloat(row.querySelector(".item-price").value) || 0;
      total += qty * price;
    });
    return total;
  }

  //  update the total amount button when items change
  document
    .querySelector(".items-container")
    .addEventListener("input", function () {
      const total = calculateTotalAmount();
      document.getElementById(
        "totalAMount"
      ).textContent = `Total Amount: $${total.toFixed(2)}`;
    });

    // Obj to store the items data
  let itemsData = [];

  // Generate the receipt preview
  function generateReceipt() {
    // Get form values
    const businessName = document.getElementById("businessName").value;
    const receiptNumber = document.getElementById("receiptNumber").value;
    const customerName = document.getElementById("customerName").value;
    const phone = document.getElementById("customerPhone").value;
    const date = document.getElementById("date").value;
    const notes = document.getElementById("notes").value;
    const payment_method = document.getElementById("payment-method").value;

    if (
      receiptNumber === "" ||
      businessName === "" ||
      customerName === "" ||
      phone === "+91"
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Update receipt header
    document.getElementById("receipt-logo").textContent = businessName;
    document.getElementById("receipt-no").textContent = receiptNumber;
    document.getElementById("receipt-date").textContent = formatDate(date);
    document.getElementById("receipt-customer").textContent = customerName;
    document.getElementById("receipt-phone").textContent = phone;
    document.getElementById("receipt-notes").textContent = notes
      ? `Notes: ${notes}`
      : "";

    // Process items
    const itemRows = document.querySelectorAll(".item-row");
    console.log(itemRows);
    const receiptItems = document.getElementById("receipt-items");
    receiptItems.innerHTML = "";

    let subtotal = 0;

    itemRows.forEach((row) => {
      const desc = row.querySelector(".item-desc").value;
      const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
      const price = parseFloat(row.querySelector(".item-price").value) || 0;
      const amount = qty * price;

      if (desc && (qty > 0 || price > 0)) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${desc}</td>
                    <td>${qty}</td>
                    <td>${formatCurrency(price)}</td>
                    <td>${formatCurrency(amount)}</td>
                `;
        receiptItems.appendChild(tr);
        subtotal += amount;
        // Store item data
        itemsData.push({
          description: desc,
          quantity: qty,
          price: price,
          amount: amount,
        });
      }
    });

    // Calculate totals
    const total = subtotal;

    document.getElementById("subtotal").textContent = formatCurrency(subtotal);
    document.getElementById("total").textContent = formatCurrency(total);
    document.getElementById("display-payment-method").textContent = payment_method;
    document.getElementById("amount-paid").textContent = formatCurrency(subtotal);

    //set generate button disabled
    const generateBtnRef = document.getElementById("generateBtn");
    generateBtnRef.disabled = true;
    generateBtnRef.style.opacity = "0.3";

    // Show receipt and action buttons
    document.getElementById("receiptOutput").style.display = "block";
    document.getElementById("actionButtons").style.display = "flex";

    console.log("Items Data:", itemsData);
  }

  // Hide receipt output 
  const hideReceiptOutput = () => {
        document.getElementById("receiptOutput").style.display = "none";
        document.getElementById("actionButtons").style.display = "none";

        //set generate button apperance
        const generateBtnRef = document.getElementById("generateBtn");
        generateBtnRef.disabled = false;
        generateBtnRef.style.opacity = "1";

        // Clear items data
        itemsData = []; // Clear the itemsData array
      };

  // Add event listener to hide receipt output on click
  document.querySelector(".closeBtn").addEventListener("click", hideReceiptOutput);


  // Download as PDF
  function downloadPDF() {
    const element = document.getElementById("receiptOutput");
    const opt = {
      margin: 10,
      filename: "receipt.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    setTimeout(() => {
      html2pdf().set(opt).from(element).save();
    }, 200); // Wait for DOM update
  }

  // Function to get all form fields
  // and prepare data for WhatsApp sharing
  const getFields = () => {
    return {
      businessName: document.getElementById("businessName").value,
      customerName: document.getElementById("customerName").value,
      customerPhone: document.getElementById("customerPhone").value,
      receiptNumber: document.getElementById("receiptNumber").value,
    };
  }

  // Share receipt via WhatsApp 
  function shareWhatsApp() {
    const finalData = getFields()
    finalData.items = itemsData; // Add items data to finalData
    console.log(finalData)
    fetch("http://localhost:3000/generate-and-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalData),
    }).then((res) => res.json()).then(res => console.log(res)).catch((err) => console.error(err));
  }
});


