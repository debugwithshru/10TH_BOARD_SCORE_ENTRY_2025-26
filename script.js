document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('boardScoreForm');
    const theoryInputs = document.querySelectorAll('.theory-input');
    const practicalInputs = document.querySelectorAll('.practical-input');
    const boardPercentDisplay = document.getElementById('boardPercentDisplay');
    const schoolPercentDisplay = document.getElementById('schoolPercentDisplay');

    // --- LOGIC: REAL-TIME MATH ---
    function updateCalculations() {
        let totalTheory = 0;
        let totalOverall = 0;
        const subjectCount = 5;

        document.querySelectorAll('.score-row').forEach(row => {
            const theory = parseFloat(row.querySelector('.theory-input').value) || 0;
            const practical = parseFloat(row.querySelector('.practical-input').value) || 0;
            const total = theory + practical;

            row.querySelector('.total-display').textContent = total;
            
            totalTheory += theory;
            totalOverall += total;
        });

        // Board % = Theory only (Avg based on 80)
        const boardP = (totalTheory / (80 * subjectCount)) * 100;
        // School Overall % = Total (Avg based on 100)
        const schoolP = (totalOverall / (100 * subjectCount)) * 100;

        boardPercentDisplay.textContent = boardP.toFixed(2) + '%';
        schoolPercentDisplay.textContent = schoolP.toFixed(2) + '%';
    }

    [...theoryInputs, ...practicalInputs].forEach(input => {
        input.addEventListener('input', () => {
            // Validation: Prevent over-marking
            const max = parseInt(input.getAttribute('max'));
            if (input.value > max) {
                input.value = max;
            }
            updateCalculations();
        });
    });

    // --- SUBMISSION ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.textContent = 'Preparing Data...';

        const fileInput = document.getElementById('scorecardFile');
        const file = fileInput.files[0];

        // We use FormData for true binary transmission (n8n "Binary Data" compatibility)
        const formDataPayload = new FormData();
        
        formDataPayload.append('form_origin', '10TH_BOARD_SCORE_ENTRY');
        formDataPayload.append('student_name', document.getElementById('student_name').value);
        formDataPayload.append('school_name', document.getElementById('school_name').value);
        formDataPayload.append('academic_year', '2025-26');
        formDataPayload.append('board_percentage', boardPercentDisplay.textContent);
        formDataPayload.append('school_overall_percentage', schoolPercentDisplay.textContent);
        formDataPayload.append('remarks', document.getElementById('remarks').value || '');

        // Capture Subject Grid & Flatten for n8n mapping
        document.querySelectorAll('.score-row').forEach(row => {
            const subjectKey = row.getAttribute('data-subject').toUpperCase().replace(/\s+/g, '_');
            const theory = parseFloat(row.querySelector('.theory-input').value) || 0;
            const practical = parseFloat(row.querySelector('.practical-input').value) || 0;
            const total = parseFloat(row.querySelector('.total-display').textContent) || 0;

            formDataPayload.append(`${subjectKey}_TH`, theory);
            formDataPayload.append(`${subjectKey}_PR`, practical);
            formDataPayload.append(`${subjectKey}_TOTAL`, total);
        });

        // THE ACTUAL BINARY FILE
        if (file) {
            formDataPayload.append('scorecard', file);
        }

        btn.textContent = 'Uploading Binary Data...';

        try {
            // PRODUCTION WEBHOOK URL
            const WEBHOOK_URL = 'https://n8n.srv1498466.hstgr.cloud/webhook/af03ba5f-1fa0-4c11-9642-5f5a610f064a';
            
            // Note: We DO NOT set 'Content-Type' header. 
            // The browser will automatically set it to multipart/form-data with the correct boundary.
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                body: formDataPayload
            });

            if (!response.ok) throw new Error('Submission failed with status ' + response.status);

            document.getElementById('successOverlay').classList.add('active');
            
            setTimeout(() => {
                document.getElementById('successOverlay').classList.remove('active');
                btn.disabled = false;
                btn.textContent = 'Submit Result';
                form.reset();
                document.querySelectorAll('.total-display').forEach(td => td.textContent = '0');
                boardPercentDisplay.textContent = '0.00%';
                schoolPercentDisplay.textContent = '0.00%';
            }, 3000);

        } catch (err) {
            console.error('Submit Failed', err);
            btn.disabled = false;
            btn.textContent = 'Submit Result';
            alert('Upload failed. Please check your internet or webhook status.');
        }
    });
});
