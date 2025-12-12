document.addEventListener('DOMContentLoaded', () => {
    // DOM Element Selectors
    const mealForm = document.getElementById('meal-form');
    const mealList = document.getElementById('meal-list');
    const consumedDisplay = document.getElementById('consumed-display');
    const progressBar = document.getElementById('progress-bar');
    const dailyGoalDisplay = document.getElementById('goal-display');
    
    // Initial State Variables
    let dailyGoal = 2000; // Feature 1d placeholder: this would be user-set
    let totalConsumed = 0;
    let mealsTracked = [];

    // Function to update the dashboard stats (Feature 1b & 1c)
    function updateDashboard() {
        consumedDisplay.textContent = `${totalConsumed} kcal`;
        dailyGoalDisplay.textContent = `${dailyGoal} kcal`;

        // Calculate progress percentage
        const progressPercent = Math.min((totalConsumed / dailyGoal) * 100, 100);
        progressBar.style.width = `${progressPercent}%`;

        // Change progress bar color if goal is exceeded
        if (totalConsumed >= dailyGoal) {
            progressBar.style.backgroundColor = '#e53935'; // Red color for exceeded goal
        } else {
            progressBar.style.backgroundColor = 'var(--secondary-color)';
        }
    }

    // Function to render the list of meals (Feature 1a)
    function renderMeals() {
        mealList.innerHTML = ''; // Clear current list
        mealsTracked.forEach(meal => {
            const li = document.createElement('li');
            li.classList.add('meal-item');
            li.innerHTML = `
                <span>${meal.name} (${meal.category})</span>
                <span class="meal-calories">${meal.calories} kcal</span>
            `;
            mealList.appendChild(li);
        });
    }

    // Handle form submission
    mealForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const mealName = document.getElementById('meal-name').value;
        const mealCategory = document.getElementById('meal-category').value;
        const mealCalories = parseInt(document.getElementById('meal-calories').value, 10);

        if (mealName && mealCategory && mealCalories > 0) {
            const newMeal = {
                name: mealName,
                category: mealCategory,
                calories: mealCalories,
                date: new Date().toISOString()
            };

            mealsTracked.push(newMeal);
            totalConsumed += mealCalories;

            renderMeals();
            updateDashboard();
            mealForm.reset(); // Clear the form inputs
        }
    });

    // Initialize the dashboard on load
    updateDashboard();
});
