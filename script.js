document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('boardScoreForm');
    const theoryInputs = document.querySelectorAll('.theory-input');
    const practicalInputs = document.querySelectorAll('.practical-input');
    
    const boardPercentDisplay = document.getElementById('boardPercentDisplay');
    const bestOf5PercentDisplay = document.getElementById('bestOf5PercentDisplay');
    const schoolPercentDisplay = document.getElementById('schoolPercentDisplay');

    // --- LOGIC: REAL-TIME MATH ---
    function updateCalculations() {
        let totalTheoryMain = 0; // English + Math + Sci + SS + 2nd Lang
        let totalAllSubjects = 0; // Sum of all 6
        const mainSubjectCount = 5;
        const allTotals = [];

        document.querySelectorAll('.score-row').forEach(row => {
            const subjectLabel = row.getAttribute('data-subject');
            const theory = parseFloat(row.querySelector('.theory-input').value) || 0;
            const practical = parseFloat(row.querySelector('.practical-input').value) || 0;
            const total = theory + practical;

            row.querySelector('.total-display').textContent = total;
            
            // Collect all totals for Best of 5
            allTotals.push(total);
            totalAllSubjects += total;

            // Main Theory: Everything except Optional Subject
            if (subjectLabel !== 'Optional Subject') {
                totalTheoryMain += theory;
            }
        });

        // 1. Boards % = Theory only (Avg based on first 5 subjects max 80)
        const boardP = (totalTheoryMain / (80 * mainSubjectCount)) * 100;
        
        // 2. Best of 5 % = Top 5 totals / 500
        const top5Sum = [...allTotals].sort((a,b) => b-a).slice(0, 5).reduce((a,b) => a+b, 0);
        const best5P = (top5Sum / 500) * 100;

        // 3. School Overall % = Total of all 6 / 600
        const schoolP = (totalAllSubjects / 600) * 100;

        boardPercentDisplay.textContent = boardP.toFixed(2) + '%';
        bestOf5PercentDisplay.textContent = best5P.toFixed(2) + '%';
        schoolPercentDisplay.textContent = schoolP.toFixed(2) + '%';
    }

    [...theoryInputs, ...practicalInputs].forEach(input => {
        input.addEventListener('input', () => {
            const max = parseInt(input.getAttribute('max'));
            if (parseFloat(input.value) > max) {
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

        const formDataPayload = new FormData();
        
        formDataPayload.append('form_origin', '10TH_BOARD_SCORE_ENTRY');
        formDataPayload.append('student_name', document.getElementById('student_name').value);
        formDataPayload.append('school_name', document.getElementById('school_name').value);
        formDataPayload.append('academic_year', '2025-26');
        
        // Choice Selections
        formDataPayload.append('chosen_2nd_language', document.getElementById('chosen_2nd_language').value);
        formDataPayload.append('chosen_optional_subject', document.getElementById('chosen_optional_subject').value);

        // Percentages
        formDataPayload.append('board_percentage', boardPercentDisplay.textContent);
        formDataPayload.append('best_of_5_percentage', bestOf5PercentDisplay.textContent);
        formDataPayload.append('school_overall_percentage', schoolPercentDisplay.textContent);
        
        formDataPayload.append('remarks', document.getElementById('remarks').value || '');

        // Flatten Subject Marks
        document.querySelectorAll('.score-row').forEach(row => {
            const subjectKey = row.getAttribute('data-subject').toUpperCase().replace(/\s+/g, '_');
            const theory = parseFloat(row.querySelector('.theory-input').value) || 0;
            const practical = parseFloat(row.querySelector('.practical-input').value) || 0;
            const total = parseFloat(row.querySelector('.total-display').textContent) || 0;

            formDataPayload.append(`${subjectKey}_TH`, theory);
            formDataPayload.append(`${subjectKey}_PR`, practical);
            formDataPayload.append(`${subjectKey}_TOTAL`, total);
        });

        if (file) {
            formDataPayload.append('scorecard', file);
        }

        btn.textContent = 'Uploading Binary Data...';

        try {
            const WEBHOOK_URL = 'https://n8n.srv1498466.hstgr.cloud/webhook/af03ba5f-1fa0-4c11-9642-5f5a610f064a';
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                body: formDataPayload
            });

            if (!response.ok) throw new Error('Submission failed');

            document.getElementById('successOverlay').classList.add('active');
            
            setTimeout(() => {
                document.getElementById('successOverlay').classList.remove('active');
                btn.disabled = false;
                btn.textContent = 'Submit Result';
                form.reset();
                document.querySelectorAll('.total-display').forEach(td => td.textContent = '0');
                boardPercentDisplay.textContent = '0.00%';
                bestOf5PercentDisplay.textContent = '0.00%';
                schoolPercentDisplay.textContent = '0.00%';
            }, 3000);

        } catch (err) {
            console.error('Submit Failed', err);
            btn.disabled = false;
            btn.textContent = 'Submit Result';
            alert('Upload failed. Please check connection.');
        }
    });
});
