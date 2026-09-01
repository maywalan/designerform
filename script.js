(function () {
  const form = document.getElementById("requestForm");
  const submitBtn = document.getElementById("submitBtn");
  const alertBox = document.getElementById("formAlert");

  // Default "Brief date" to today, but the field stays editable.
  const briefDateInput = document.getElementById("briefDate");
  const today = new Date();
  briefDateInput.value = today.toISOString().slice(0, 10);

  // "Others" format option enables its text input, and disables/clears it
  // again if a different option is picked.
  const formatOtherInput = document.getElementById("formatOther");
  const formatOthersRadio = document.getElementById("formatOthersRadio");
  document.querySelectorAll('input[name="format"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      const isOthers = formatOthersRadio.checked;
      formatOtherInput.disabled = !isOthers;
      if (isOthers) {
        formatOtherInput.focus();
      } else {
        formatOtherInput.value = "";
      }
    });
  });

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = "alert " + type;
    alertBox.hidden = false;
  }

  function hideAlert() {
    alertBox.hidden = true;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideAlert();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const dueDate = document.getElementById("dueDate").value;
    const briefDate = briefDateInput.value;
    if (dueDate < briefDate) {
      showAlert("Due date can't be earlier than the brief date.", "error");
      return;
    }

    const formatChoice = document.querySelector('input[name="format"]:checked');
    if (!formatChoice) {
      showAlert("Please select a format.", "error");
      return;
    }
    const format =
      formatChoice.value === "Others"
        ? formatOtherInput.value.trim()
        : formatChoice.value;
    if (!format) {
      showAlert("Please specify the format.", "error");
      return;
    }

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
      showAlert(
        "This form isn't connected to the sheet yet. Set APPS_SCRIPT_URL in config.js.",
        "error"
      );
      return;
    }

    const payload = {
      projectName: document.getElementById("projectName").value.trim(),
      details: document.getElementById("details").value.trim(),
      briefDate: briefDate,
      dueDate: dueDate,
      pic: document.getElementById("pic").value,
      priority: document.getElementById("priority").value,
      format: format,
      requesterName: document.getElementById("requesterName").value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Submission failed.");
      }

      showAlert(
        "Request submitted to " + payload.pic + ". Thank you!",
        "success"
      );
      form.reset();
      briefDateInput.value = new Date().toISOString().slice(0, 10);
      formatOtherInput.disabled = true;
    } catch (err) {
      showAlert(
        "Couldn't submit the request: " + err.message,
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit request";
    }
  });
})();
