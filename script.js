document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('boardScoreForm');
    const theoryInputs = document.querySelectorAll('.theory-input');
    const practicalInputs = document.querySelectorAll('.practical-input');
    
    const boardPercentDisplay = document.getElementById('boardPercentDisplay');
    const bestOf5PercentDisplay = document.getElementById('bestOf5PercentDisplay');
    const schoolPercentDisplay = document.getElementById('schoolPercentDisplay');

    // Overlays
    const reviewOverlay = document.getElementById('reviewOverlay');
    const successOverlay = document.getElementById('successOverlay');
    const reviewContent = document.getElementById('reviewContent');
    const confirmBtn = document.getElementById('confirmBtn');
    const editBtn = document.getElementById('editBtn');

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

    // --- OPTIONAL SUBJECT TOGGLE ---
    const optionalSubjectSelect = document.getElementById('chosen_optional_subject');
    const otherOptionalWrapper = document.getElementById('otherOptionalWrapper');
    const otherOptionalInput = document.getElementById('other_optional_subject');

    optionalSubjectSelect.addEventListener('change', () => {
        if (optionalSubjectSelect.value === 'OTHER') {
            otherOptionalWrapper.classList.remove('hidden-field');
            otherOptionalInput.setAttribute('required', 'true');
        } else {
            otherOptionalWrapper.classList.add('hidden-field');
            otherOptionalInput.removeAttribute('required');
            otherOptionalInput.value = '';
        }
    });

    // --- REVIEW LOGIC ---
    function showReview() {
        const student = document.getElementById('student_name').value;
        const school = document.getElementById('school_name').value;
        const grade9Pct = document.getElementById('grade_9_percentage').value;
        const lang2nd = document.getElementById('chosen_2nd_language').value;
        let optSub = optionalSubjectSelect.value;
        if (optSub === 'OTHER') optSub = otherOptionalInput.value || 'Other';

        let html = `
            <div class="review-item highlight"><span>Student:</span> <span>${student}</span></div>
            <div class="review-item"><span>School:</span> <span>${school}</span></div>
            <div class="review-item"><span>Grade 9th Pct:</span> <span>${grade9Pct}%</span></div>
            <div class="review-item"><span>2nd Language:</span> <span>${lang2nd}</span></div>
            <div class="review-item"><span>Optional:</span> <span>${optSub}</span></div>
            <div style="margin: 10px 0; border-top: 1px dashed #ccc;"></div>
        `;

        document.querySelectorAll('.score-row').forEach(row => {
            const label = row.querySelector('.subject-name').textContent;
            const theory = row.querySelector('.theory-input').value || 0;
            const practical = row.querySelector('.practical-input').value || 0;
            const total = row.querySelector('.total-display').textContent;
            html += `<div class="review-item"><span>${label}:</span> <span>T:${theory} + P:${practical} = ${total}</span></div>`;
        });

        html += `
            <div style="margin: 10px 0; border-top: 1px dashed #ccc;"></div>
            <div class="review-item total"><span>Boards % (Theory):</span> <span>${boardPercentDisplay.textContent}</span></div>
            <div class="review-item total"><span>Best of 5 %:</span> <span>${bestOf5PercentDisplay.textContent}</span></div>
            <div class="review-item total"><span>School Overall %:</span> <span>${schoolPercentDisplay.textContent}</span></div>
        `;

        reviewContent.innerHTML = html;
        reviewOverlay.classList.add('active');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showReview();
    });

    editBtn.addEventListener('click', () => {
        reviewOverlay.classList.remove('active');
    });

    // --- ACTUAL FINAL SUBMISSION ---
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Submitting...';

        const fileInput = document.getElementById('scorecardFile');
        const file = fileInput.files[0];

        const formDataPayload = new FormData();
        
        formDataPayload.append('form_origin', '10TH_BOARD_SCORE_ENTRY');
        formDataPayload.append('student_name', document.getElementById('student_name').value);
        formDataPayload.append('school_name', document.getElementById('school_name').value);
        formDataPayload.append('grade_9_percentage', document.getElementById('grade_9_percentage').value);
        formDataPayload.append('academic_year', '2025-26');
        formDataPayload.append('chosen_2nd_language', document.getElementById('chosen_2nd_language').value);
        
        let optionalSubjectValue = optionalSubjectSelect.value;
        if (optionalSubjectValue === 'OTHER') {
            optionalSubjectValue = otherOptionalInput.value.toUpperCase();
        }
        formDataPayload.append('chosen_optional_subject', optionalSubjectValue);

        formDataPayload.append('board_percentage', boardPercentDisplay.textContent);
        formDataPayload.append('best_of_5_percentage', bestOf5PercentDisplay.textContent);
        formDataPayload.append('school_overall_percentage', schoolPercentDisplay.textContent);
        formDataPayload.append('remarks', document.getElementById('remarks').value || '');

        document.querySelectorAll('.score-row').forEach(row => {
            let label = row.getAttribute('data-subject');
            if (label === 'Optional Subject') label = optionalSubjectValue;
            const subjectKey = label.toUpperCase().replace(/\s+/g, '_');
            const theory = parseFloat(row.querySelector('.theory-input').value) || 0;
            const practical = parseFloat(row.querySelector('.practical-input').value) || 0;
            const total = parseFloat(row.querySelector('.total-display').textContent) || 0;
            formDataPayload.append(`${subjectKey}_TH`, theory);
            formDataPayload.append(`${subjectKey}_PR`, practical);
            formDataPayload.append(`${subjectKey}_TOTAL`, total);
        });

        if (file) formDataPayload.append('scorecard', file);

        try {
            const WEBHOOK_URL = 'https://n8n.srv1498466.hstgr.cloud/webhook/af03ba5f-1fa0-4c11-9642-5f5a610f064a';
            const response = await fetch(WEBHOOK_URL, { method: 'POST', body: formDataPayload });
            if (!response.ok) throw new Error('Submission failed');

            reviewOverlay.classList.remove('active');
            successOverlay.classList.add('active');
            
            setTimeout(() => {
                successOverlay.classList.remove('active');
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm & Finalize';
                form.reset();
                document.querySelectorAll('.total-display').forEach(td => td.textContent = '0');
                boardPercentDisplay.textContent = '0.00%';
                bestOf5PercentDisplay.textContent = '0.00%';
                schoolPercentDisplay.textContent = '0.00%';
                otherOptionalWrapper.classList.add('hidden-field');
            }, 3000);

        } catch (err) {
            console.error('Submit Failed', err);
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm & Finalize';
            alert('Upload failed. Please check connection.');
        }
    });
});
