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
        li.className = `task-item bg-gray-700 bg-opacity-60 border border-gray-600 rounded-lg transition duration-150 ease-in-out overflow-hidden hover:bg-opacity-80 cursor-pointer`; // Add task-item class
        li.dataset.taskId = task.id;

        // Add selected class if this task is selected
        if (task.id === selectedTaskId) {
             li.classList.add('bg-opacity-100', 'border-cyan-500'); // Example selected style
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
        checkbox.className = 'mr-4 h-6 w-6 text-cyan-500 bg-gray-600 border-gray-500 rounded focus:ring-cyan-400 focus:ring-offset-gray-800 cursor-pointer flex-shrink-0 task-checkbox';
        checkbox.ariaLabel = task.completed ? 'Mark task as incomplete' : 'Mark task as complete';
        checkbox.addEventListener('change', handleToggleComplete); 

        const span = document.createElement('span');
        span.className = `text-gray-50 task-text truncate`; 
        if (task.completed) {
            span.classList.add('line-through', 'text-gray-400');
        } else {
            span.classList.add('cursor-text', 
                'hover:bg-gray-600/50', 
                'focus:bg-gray-600', 
                'focus:outline-none', 
                'focus:ring-1', 
                'focus:ring-cyan-400', 
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
        deleteBtn.className = 'p-1 text-gray-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded delete-btn';
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
            taskList.innerHTML = '<p class="text-center text-gray-500 italic mt-4">No tasks yet! Add one above.</p>';
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
             previewContent.innerHTML = '<p class="italic">Select a task from the list to see its details here.</p>';
             return;
         }

         const task = tasks.find(t => t.id === selectedTaskId);
         if (!task) {
             previewContent.innerHTML = '<p class="italic text-red-400">Error: Selected task not found.</p>';
             selectedTaskId = null; // Reset selection
             return;
         }

         // Display rendered Markdown details
         previewContent.innerHTML = ''; // Clear placeholder/previous content

         const title = document.createElement('h3');
         title.textContent = task.text;
         title.className = 'text-lg font-semibold text-gray-100 mb-3 pb-2 border-b border-gray-700';
         previewContent.appendChild(title);

         const detailsRendered = document.createElement('div');
         detailsRendered.className = 'markdown-preview'; // Use the class for styling
         if (window.marked) {
              try {
                  // Use marked.parse() for newer versions
                  detailsRendered.innerHTML = typeof marked.parse === 'function' ? marked.parse(task.details || '') : marked(task.details || ''); 
              } catch (e) {
                   console.error("Markdown parsing error:", e);
                   detailsRendered.innerHTML = '<p class="text-red-400">Error rendering details.</p>';
              }
         } else {
             detailsRendered.textContent = task.details || 'No details added.'; // Fallback if marked fails
         }
         previewContent.appendChild(detailsRendered);

         // Add Edit Button
         const editButton = document.createElement('button');
         editButton.textContent = 'Edit Details';
         editButton.className = 'mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition ease-in-out duration-150';
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
         title.className = 'text-lg font-semibold text-gray-100 mb-3 pb-2 border-b border-gray-700';
         previewContent.appendChild(title);

         // Add Textarea for editing
         const detailsTextarea = document.createElement('textarea');
         detailsTextarea.id = 'detailsEditor'; // Give it an ID for easy selection
         detailsTextarea.ariaLabel = 'Task details editor';
         detailsTextarea.className = 'w-full mt-2 p-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-y text-sm text-gray-200 placeholder-gray-400';
         detailsTextarea.rows = 8; // Give more space
         detailsTextarea.value = task.details || '';
         previewContent.appendChild(detailsTextarea);

         // Add Save Button
         const saveButton = document.createElement('button');
         saveButton.textContent = 'Save Details';
         saveButton.className = 'mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-400 transition ease-in-out duration-150';
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
    };

    const handleToggleComplete = (event) => {
        // Prevent this event from bubbling up to the LI's click handler
        event.stopPropagation(); 

        const checkbox = event.target;
        const li = checkbox.closest('li');
        if (!li) return;
        const taskId = li.dataset.taskId;
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;

        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].text = li.querySelector('.task-text').textContent; // Ensure text is current before save
        saveTasks(tasks);

        // Re-render the list to update styles correctly
        renderTaskList(); 
    };

    const handleDeleteTask = (event) => {
         // Prevent this event from bubbling up to the LI's click handler
         event.stopPropagation(); 

        const button = event.currentTarget;
        const li = button.closest('li');
        if (!li) return;
        const taskId = li.dataset.taskId;

        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks(tasks);

        if (selectedTaskId === taskId) {
             selectedTaskId = null; // Deselect if the deleted task was selected
        }
        renderTaskList(); // Re-render list and update preview
    };

    const handleSelectTask = (event) => {
         // Don't select if clicking on checkbox, editable text, or delete button
         if (event.target.closest('.task-checkbox') || 
             event.target.closest('.task-text') || 
             event.target.closest('.delete-btn')) {
             return; 
         }

         const li = event.currentTarget; // LI element itself
         const taskId = li.dataset.taskId;

         if (selectedTaskId === taskId) {
            // Optional: Deselect if clicking the already selected task
            // selectedTaskId = null;
         } else {
             selectedTaskId = taskId;
         }

         renderTaskList(); // Re-render list to update visual selection & preview
    };

    const handleTaskTextEdit = (event) => {
         // Prevent this event from bubbling up to the LI's click handler
         event.stopPropagation(); 

        const span = event.target;
        const li = span.closest('li');
        if (!li) return;
        const taskId = li.dataset.taskId;
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex > -1) {
            const newText = span.textContent.trim();
            if (tasks[taskIndex].text !== newText) {
                if (newText === "") {
                     span.textContent = tasks[taskIndex].text;
                     return;
                 }
                tasks[taskIndex].text = newText;
                saveTasks(tasks);
                
                // If the edited task is the selected one, update the preview panel title
                if (selectedTaskId === taskId) {
                    updatePreviewPanel();
                }
            }
             // Disable editing again if task was completed while editing somehow
             span.contentEditable = !tasks[taskIndex].completed;
        }
    };

    // ----- Initial Setup -----
    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
             event.preventDefault();
            handleAddTask();
        }
    });

    // Link editable list title to banner title
    if (editableListTitle && bannerTitle) {
        // Set initial banner title
        bannerTitle.textContent = editableListTitle.textContent;
        
        // Update banner title on input
        editableListTitle.addEventListener('input', () => {
            bannerTitle.textContent = editableListTitle.textContent;
        });
    }

    renderTaskList(); // Initial render including preview panel state
}); 