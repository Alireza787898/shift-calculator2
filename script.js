const monthSelect = document.getElementById('month-select');
const viewSelect = document.getElementById('view-select');
const toggleViewBtn = document.getElementById('toggle-view-btn');
const calendarGrid = document.getElementById('calendar-grid');
const calculateBtn = document.getElementById('calculate-btn');
const resultDiv = document.getElementById('result');
const exportBtn = document.getElementById('export-btn');
const captureArea = document.getElementById('capture-area');

const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const persianWeekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Index of the first day of each month in 1404 (0=شنبه, ..., 6=جمعه)
const startDayIndexes1404 = [6, 2, 5, 1, 4, 0, 3, 5, 0, 2, 4, 6];

// تعطیلات رسمی سال ۱۴۰۴
const holidays1404 = [
    [1, 1], [1, 2], [1, 3], [1, 11], [1, 12], [1, 13], 
    [2, 4],
    [3, 14], [3, 15], [3, 16], [3, 24],
    [4, 14], [4, 15],
    [5, 23], [5, 31],
    [6, 2], [6, 10], [6, 19],
    [9, 3], 
    [10, 13], [10, 27],
    [11, 15], [11, 22],
    [12, 20], [12, 29]
];

// Array to store shift inputs temporarily
let savedShifts = [];

// Function to check for holidays
function isHoliday(month, day) {
    for (let h of holidays1404) {
        if (h[0] === month + 1 && h[1] === day) {
            return true;
        }
    }
    return false;
}

// Function to get days in month
function getDaysInMonth(monthIndex) {
    if (monthIndex < 6) return 31;
    if (monthIndex < 11) return 30;
    return 29;
}

// Function to save shifts from the grid
function saveShifts() {
    const shiftInputs = document.querySelectorAll('.shift-input');
    savedShifts = Array.from(shiftInputs).map(input => input.value.trim().toUpperCase());
}

// Function to load shifts into the grid
function loadShifts() {
    const shiftInputs = document.querySelectorAll('.shift-input');
    shiftInputs.forEach((input, index) => {
        if (savedShifts[index]) {
            input.value = savedShifts[index];
        }
    });
}

function createCalendar(monthIndex, viewMode) {
    calendarGrid.innerHTML = '';
    
    // Clear existing classes and add the correct one based on viewMode
    calendarGrid.classList.remove('calendar-grid', 'linear-grid');
    calendarGrid.classList.add(viewMode === 'linear' ? 'linear-grid' : 'calendar-grid');

    const daysInMonth = getDaysInMonth(monthIndex);
    const startDayIndex = startDayIndexes1404[monthIndex];

    if (viewMode === 'calendar') {
        // Add weekday headers (شنبه تا جمعه)
        persianWeekdays.forEach(dayName => {
            const headerCell = document.createElement('div');
            headerCell.classList.add('day-name', 'weekday-header');
            headerCell.textContent = dayName;
            calendarGrid.appendChild(headerCell);
        });

        // Add empty cells for the days before the 1st of the month
        for (let i = 0; i < startDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-cell', 'empty');
            calendarGrid.appendChild(emptyCell);
        }
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeekIndex = (startDayIndex + day - 1) % 7;
        
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');
        
        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = day;
        
        const dayName = document.createElement('div');
        dayName.classList.add('day-name');
        dayName.textContent = persianWeekdays[dayOfWeekIndex];
        
        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('shift-input');
        
        if (dayOfWeekIndex === 6) {
            cell.classList.add('weekend');
        } else if (isHoliday(monthIndex, day)) {
            cell.classList.add('holiday');
        }

        cell.appendChild(dayNumber);
        cell.appendChild(dayName);
        cell.appendChild(input);
        
        calendarGrid.appendChild(cell);
    }

    loadShifts(); // Load saved shifts after creating the new grid
}

function calculateHours() {
    let totalWorkHours = 0;
    let totalLeaveHours = 0;
    let leaveCount = 0; // متغیر جدید برای شمارش مرخصی‌ها
    const shiftInputs = document.querySelectorAll('.shift-input');
    const shifts = Array.from(shiftInputs).map(input => input.value.trim().toUpperCase());

    for (let i = 0; i < shifts.length; i++) {
        const currentShift = shifts[i];
        switch(currentShift) {
            case 'D': totalWorkHours += 7.5; break;
            case 'E': totalWorkHours += 6.5; break;
            case 'N':
                if (i + 1 < shifts.length && (shifts[i + 1] === 'D' || shifts[i + 1] === 'DN')) {
                    totalWorkHours += 11.0;
                } else {
                    totalWorkHours += 11.5;
                }
                break;
            case 'DE': totalWorkHours += 13.5; break;
            case 'EN': totalWorkHours += 17.5; break;
            case 'DN':
                if (i + 1 < shifts.length && shifts[i + 1] === 'D') {
                    totalWorkHours += 18.5;
                } else {
                    totalWorkHours += 19;
                }
                break;
            case 'M': 
                totalLeaveHours += 7.33; 
                leaveCount++; // شمارش مرخصی
                break;
        }
    }
    
    const totalOverallHours = totalWorkHours + totalLeaveHours;
    const ATTENDANCE_OBLIGATION = 192;
    let attendanceDeficit = ATTENDANCE_OBLIGATION - totalOverallHours;
    
    // Determine color and sign based on deficit/surplus
    let deficitColorClass = '';
    let deficitSign = '';

    if (attendanceDeficit > 0) {
        deficitColorClass = 'red-text'; // Less than 192 -> Deficit -> Red
        deficitSign = '+';
    } else {
        deficitColorClass = 'green-text'; // More than 192 -> Surplus -> Green
        deficitSign = '-';
        attendanceDeficit = Math.abs(attendanceDeficit); // Display as a positive number with a minus sign
    }

    resultDiv.innerHTML = `
        <table class="result-table">
            <thead>
                <tr>
                    <th>جمع ساعات حضور</th>
                    <th>جمع ساعات مرخصی</th>
                    <th>کارکرد کل</th>
                    <th>کسر حضور</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${totalWorkHours.toFixed(2)}</td>
                    <td>${totalLeaveHours.toFixed(2)} (${leaveCount} مرخصی)</td>
                    <td>${totalOverallHours.toFixed(2)}</td>
                    <td><span class="${deficitColorClass}">${deficitSign}${attendanceDeficit.toFixed(2)}</span></td>
                </tr>
            </tbody>
        </table>
    `;
}

// Function to export the calendar as a PDF
function exportAsPDF() {
    const { jsPDF } = window.jspdf;
    
    // Check if the current view is linear
    if (viewSelect.value === 'linear') {
        const userConfirmation = confirm("خروجی فقط روی حالت تقویمی ذخیره می‌شود. آیا مایل به تغییر حالت نمایش هستید؟");
        if (userConfirmation) {
            viewSelect.value = 'calendar';
            const selectedMonthIndex = parseInt(monthSelect.value);
            saveShifts();
            createCalendar(selectedMonthIndex, 'calendar');

            // Wait a moment for the new grid to render, then export
            setTimeout(() => {
                html2canvas(captureArea, { scale: 2 }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;
                    const pdf = new jsPDF('p', 'px', [imgWidth, imgHeight]);
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    pdf.save('گزارش-شیفت.pdf');
                });
            }, 100); // 100ms delay to ensure proper rendering
        }
    } else { // Current view is already calendar
        html2canvas(captureArea, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const pdf = new jsPDF('p', 'px', [imgWidth, imgHeight]);
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('گزارش-شیفت.pdf');
        });
    }
}

// Function to toggle view with data preservation
function toggleViewWithData() {
    saveShifts();
    const selectedMonthIndex = parseInt(monthSelect.value);
    const newViewMode = viewSelect.value === 'calendar' ? 'linear' : 'calendar';
    viewSelect.value = newViewMode;
    createCalendar(selectedMonthIndex, newViewMode);
}

// Populate month select
persianMonths.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = month;
    monthSelect.appendChild(option);
});

// Event listeners
monthSelect.addEventListener('change', () => {
    const selectedMonthIndex = parseInt(monthSelect.value);
    const selectedViewMode = viewSelect.value;
    saveShifts(); // Save shifts before changing view
    createCalendar(selectedMonthIndex, selectedViewMode);
});

viewSelect.addEventListener('change', () => {
    const selectedMonthIndex = parseInt(monthSelect.value);
    const selectedViewMode = viewSelect.value;
    saveShifts(); // Save shifts before changing view
    createCalendar(selectedMonthIndex, selectedViewMode);
});

toggleViewBtn.addEventListener('click', toggleViewWithData);
calculateBtn.addEventListener('click', calculateHours);
exportBtn.addEventListener('click', exportAsPDF);

// Initial calendar creation with default values
createCalendar(0, 'calendar');