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
        btn.textContent = 'Processing File...';

        const fileInput = document.getElementById('scorecardFile');
        let fileBase64 = null;
        let fileName = null;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName = file.name;
            try {
                fileBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsDataURL(file);
                });
            } catch (err) {
                console.error('File reading failed', err);
                alert('Could not read the scorecard file.');
                btn.disabled = false;
                btn.textContent = 'Submit Result';
                return;
            }
        }

        btn.textContent = 'Submitting Results...';
        const formData = new FormData(form);
        const subjectsData = [];
        
        document.querySelectorAll('.score-row').forEach(row => {
            subjectsData.push({
                subject: row.getAttribute('data-subject'),
                theory: parseFloat(row.querySelector('.theory-input').value) || 0,
                practical: parseFloat(row.querySelector('.practical-input').value) || 0,
                total: parseFloat(row.querySelector('.total-display').textContent) || 0
            });
        });

        const payload = {
            form_origin: "10TH_BOARD_SCORE_ENTRY",
            student_name: formData.get('student_name'),
            school_name: formData.get('school_name'),
            academic_year: "2025-26",
            subjects: subjectsData,
            board_percentage: boardPercentDisplay.textContent,
            school_overall_percentage: schoolPercentDisplay.textContent,
            scorecard_filename: fileName,
            scorecard_base64: fileBase64,
            remarks: formData.get('remarks') || ''
        };

        console.log('Sending Board Score Payload with File:', payload.student_name);

        try {
            const WEBHOOK_URL = 'https://n8n.srv1498466.hstgr.cloud/webhook/af03ba5f-1fa0-4c11-9642-5f5a610f064a';
            
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

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
            alert('Submission failed. Check network log.');
        }
    });
});
