document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const previewPanel = document.getElementById('previewPanel');
    const previewContent = document.getElementById('previewContent');
    const previewActions = document.getElementById('previewActions');
    const bannerTitle = document.getElementById('bannerTitle'); // Get Banner Title H1
    const editableListTitle = document.getElementById('editableListTitle'); // Get Editable H2

    const storageKey = 'todoTasks';
    let selectedTaskId = null; // Track the selected task ID

    // ----- Data Handling -----
    const getTasks = () => {
        const tasksJson = localStorage.getItem(storageKey);
        let tasks = [];
        if (tasksJson) {
            try {
                tasks = JSON.parse(tasksJson);
                tasks = tasks.map(task => ({
                    ...task,
                    details: task.details || '',
                    completed: !!task.completed // Ensure boolean
                }));
            } catch (e) {
                console.error("Error parsing tasks from localStorage:", e);
                tasks = [];
                localStorage.removeItem(storageKey);
            }
        }
        return tasks;
    };

    const saveTasks = (tasks) => {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    };

    let tasks = getTasks();

    // ----- Rendering -----
    const renderTask = (task) => {
        const li = document.createElement('li');
        li.className = `task-item bg-white border border-gray-200 rounded-lg transition duration-150 ease-in-out overflow-hidden hover:bg-gray-50 cursor-pointer`; // Updated for light theme
        li.dataset.taskId = task.id;

        // Add selected class if this task is selected
        if (task.id === selectedTaskId) {
             li.classList.add('bg-blue-50', 'border-blue-300'); // Updated for light theme
        }

        if (task.completed) {
            li.classList.add('completed'); // Still apply completed style for opacity etc.
        }

        const mainRow = document.createElement('div');
        mainRow.className = 'flex items-center justify-between p-4';

        const taskContent = document.createElement('div');
        taskContent.className = 'flex items-center flex-grow mr-4 min-w-0';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.className = 'mr-4 h-6 w-6 text-blue-500 bg-white border-gray-300 rounded focus:ring-blue-400 focus:ring-offset-white cursor-pointer flex-shrink-0 task-checkbox'; // Updated for light theme
        checkbox.ariaLabel = task.completed ? 'Mark task as incomplete' : 'Mark task as complete';
        checkbox.addEventListener('change', handleToggleComplete); 

        const span = document.createElement('span');
        span.className = `text-gray-800 task-text truncate`; // Updated for light theme
        if (task.completed) {
            span.classList.add('line-through', 'text-gray-400');
        } else {
            span.classList.add('cursor-text', 
                'hover:bg-gray-100', // Updated for light theme
                'focus:bg-gray-100', // Updated for light theme
                'focus:outline-none', 
                'focus:ring-1', 
                'focus:ring-blue-400', // Updated for light theme
                'rounded-md', 
                'px-1', 
                '-mx-1', 
                'transition', 
                'duration-150', 
                'ease-in-out');
        }
        span.textContent = task.text;
        span.contentEditable = !task.completed; // Only allow editing if not completed
        span.ariaLabel = "Task text (editable)";
        span.addEventListener('blur', handleTaskTextEdit); 

        taskContent.appendChild(checkbox);
        taskContent.appendChild(span);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex items-center flex-shrink-0 space-x-2';

        // Only Delete button remains here
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>`;
        deleteBtn.className = 'p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded delete-btn'; // Updated for light theme
        deleteBtn.ariaLabel = 'Delete task';
        deleteBtn.addEventListener('click', handleDeleteTask); 

        actionsDiv.appendChild(deleteBtn);

        mainRow.appendChild(taskContent);
        mainRow.appendChild(actionsDiv);

        li.appendChild(mainRow);

        // Add click listener to the whole LI for selection
        li.addEventListener('click', handleSelectTask); 

        return li;
    };

    const renderTaskList = () => {
        taskList.innerHTML = ''; 
        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="text-center text-gray-500 italic mt-4">No tasks yet! Add one above.</p>'; // Updated for light theme
             // Clear preview if list is empty
             selectedTaskId = null;
             updatePreviewPanel(); 
            return;
        }
        tasks.forEach(task => {
            taskList.appendChild(renderTask(task));
        });
        // Ensure preview is updated if the selected task still exists
        if (selectedTaskId && !tasks.some(t => t.id === selectedTaskId)) {
             selectedTaskId = null;
        }
        updatePreviewPanel(); 
    };

    // ----- Preview Panel Logic -----
    const updatePreviewPanel = () => {
         // Clear previous actions
         previewActions.innerHTML = ''; 

         if (!selectedTaskId) {
             previewContent.innerHTML = '<p class="italic text-gray-500">Select a task from the list to see its details here.</p>'; // Updated for light theme
             return;
         }

         const task = tasks.find(t => t.id === selectedTaskId);
         if (!task) {
             previewContent.innerHTML = '<p class="italic text-red-500">Error: Selected task not found.</p>'; // Updated for light theme
             selectedTaskId = null; // Reset selection
             return;
         }

         // Display rendered Markdown details
         previewContent.innerHTML = ''; // Clear placeholder/previous content

         const title = document.createElement('h3');
         title.textContent = task.text;
         title.className = 'text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200'; // Updated for light theme
         previewContent.appendChild(title);

         const detailsRendered = document.createElement('div');
         detailsRendered.className = 'markdown-preview'; // Use the class for styling
         if (window.marked) {
              try {
                  // Use marked.parse() for newer versions
                  detailsRendered.innerHTML = typeof marked.parse === 'function' ? marked.parse(task.details || '') : marked(task.details || ''); 
              } catch (e) {
                   console.error("Markdown parsing error:", e);
                   detailsRendered.innerHTML = '<p class="text-red-500">Error rendering details.</p>'; // Updated for light theme
              }
         } else {
             detailsRendered.textContent = task.details || 'No details added.'; // Fallback if marked fails
         }
         previewContent.appendChild(detailsRendered);

         // Add Edit Button
         const editButton = document.createElement('button');
         editButton.textContent = 'Edit Details';
         editButton.className = 'mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-150'; // Updated for light theme
         editButton.addEventListener('click', handleEditDetailsClick);
         previewActions.appendChild(editButton);
    };

    const handleEditDetailsClick = () => {
         if (!selectedTaskId) return;
         const task = tasks.find(t => t.id === selectedTaskId);
         if (!task) return;

         // Clear preview content and actions
         previewContent.innerHTML = '';
         previewActions.innerHTML = '';

         // Add title back
         const title = document.createElement('h3');
         title.textContent = task.text;
         title.className = 'text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200'; // Updated for light theme
         previewContent.appendChild(title);

         // Add Textarea for editing
         const detailsTextarea = document.createElement('textarea');
         detailsTextarea.id = 'detailsEditor'; // Give it an ID for easy selection
         detailsTextarea.ariaLabel = 'Task details editor';
         detailsTextarea.className = 'w-full mt-2 p-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-y text-sm text-gray-800 placeholder-gray-400'; // Updated for light theme
         detailsTextarea.rows = 8; // Give more space
         detailsTextarea.value = task.details || '';
         previewContent.appendChild(detailsTextarea);

         // Add Save Button
         const saveButton = document.createElement('button');
         saveButton.textContent = 'Save Details';
         saveButton.className = 'mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-150'; // Updated for light theme
         saveButton.addEventListener('click', handleSaveDetailsClick);
         previewActions.appendChild(saveButton);

         detailsTextarea.focus(); // Focus the textarea
    };

    const handleSaveDetailsClick = () => {
         if (!selectedTaskId) return;
         const taskIndex = tasks.findIndex(t => t.id === selectedTaskId);
         if (taskIndex === -1) return;

         const detailsTextarea = document.getElementById('detailsEditor');
         if (detailsTextarea) {
             tasks[taskIndex].details = detailsTextarea.value;
             saveTasks(tasks);
             updatePreviewPanel(); // Go back to preview mode
         } else {
             console.error("Could not find details editor textarea");
         }
    };

    // ----- Event Handlers -----
    const handleAddTask = () => {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        const newTask = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            details: ""
        };
        tasks.push(newTask);
        saveTasks(tasks);
        renderTaskList(); // Will also update preview if needed
        taskInput.value = '';
        taskInput.focus();

        // After adding a task, select it immediately
        selectedTaskId = newTask.id;
        updatePreviewPanel();
    };

    const handleToggleComplete = (e) => {
        // Stop the click event from bubbling to the task item
        e.stopPropagation(); 
        const taskId = e.target.closest('.task-item').dataset.taskId;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks(tasks);
            renderTaskList(); // Redraw with updated state
        }
    };

    const handleDeleteTask = (e) => {
        // Stop the click event from bubbling to the task item
        e.stopPropagation(); 
        if (confirm('Are you sure you want to delete this task?')) {
            const taskId = e.target.closest('.task-item').dataset.taskId;
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                // If deleted task was selected, clear selection
                if (tasks[taskIndex].id === selectedTaskId) {
                    selectedTaskId = null;
                }
                tasks.splice(taskIndex, 1);
                saveTasks(tasks);
                renderTaskList(); // Will also update preview if needed
            }
        }
    };

    const handleTaskTextEdit = (e) => {
        // Only run this if target is span (don't want to handle checkbox or button events)
        if (e.target.tagName.toLowerCase() !== 'span') return;
        const taskId = e.target.closest('.task-item').dataset.taskId;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
             const newText = e.target.textContent.trim();
             if (newText === '') {
                 e.target.textContent = tasks[taskIndex].text; // Restore previous if empty
                 return;
             }
             tasks[taskIndex].text = newText;
             saveTasks(tasks);
             
             // If this was the selected task, update the preview panel title too
             if (taskId === selectedTaskId) {
                 updatePreviewPanel();
             }
        }
    };

    const handleSelectTask = (e) => {
        // Don't select when clicks are on checkbox, buttons, or contenteditable span
        if (
            e.target.classList.contains('task-checkbox') || 
            e.target.classList.contains('delete-btn') || 
            (e.target.tagName.toLowerCase() === 'span' && e.target.isContentEditable)
        ) {
            return;
        }
        
        const taskLi = e.target.closest('.task-item');
        const taskId = taskLi.dataset.taskId;
        
        // Toggle selection if clicking the same task
        if (selectedTaskId === taskId) {
            selectedTaskId = null;
        } else {
            selectedTaskId = taskId;
        }
        
        renderTaskList(); // Re-render to update selected styling
    };

    // ----- Initialize UI -----
    const initializeApp = () => {
        // Set up event listeners
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddTask();
                e.preventDefault(); // Prevent form submission
            }
        });
        addTaskBtn.addEventListener('click', handleAddTask);
        
        renderTaskList(); // Initial render
        
        // Save the list title to localStorage when it changes
        editableListTitle.addEventListener('blur', () => {
            const newTitle = editableListTitle.textContent.trim();
            localStorage.setItem('todoListTitle', newTitle);
        });
        
        // Load list title from localStorage if it exists
        const savedTitle = localStorage.getItem('todoListTitle');
        if (savedTitle) {
            editableListTitle.textContent = savedTitle;
        }
        
        // Make banner title also editable with localStorage persistence
        bannerTitle.contentEditable = true;
        bannerTitle.addEventListener('blur', () => {
            const newBannerTitle = bannerTitle.textContent.trim();
            localStorage.setItem('todoBannerTitle', newBannerTitle);
        });
        bannerTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent adding new lines
                bannerTitle.blur(); // Unfocus to trigger save
            }
        });
        // Styling for banner title to show it's editable
        bannerTitle.classList.add(
            'cursor-text',
            'hover:bg-gray-100', // Updated for light theme 
            'focus:bg-gray-100', // Updated for light theme
            'focus:outline-none',
            'px-4',
            'py-1',
            'rounded-md',
            'focus:ring-2',
            'focus:ring-blue-400', // Updated for light theme
            'transition',
            'duration-150',
            'ease-in-out'
        );
        
        // Load banner title from localStorage if it exists
        const savedBannerTitle = localStorage.getItem('todoBannerTitle');
        if (savedBannerTitle) {
            bannerTitle.textContent = savedBannerTitle;
        }
        
        // Focus the task input on load for user convenience
        taskInput.focus();
    };
    
    // Start the app
    initializeApp();
}); 