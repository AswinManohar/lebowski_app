import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import '../styles/TaskBoard.css';

const TaskBoard = () => {
  const [columns, setColumns] = useState({
    'todo': {
      id: 'todo',
      title: 'TO DO',
      taskIds: []
    },
    'doing': {
      id: 'doing',
      title: 'DOING',
      taskIds: []
    }
  });
  
  const [tasks, setTasks] = useState({});
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingTo, setAddingTo] = useState(null);

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        
        // Transform data for our state structure
        const tasksById = {};
        const todoIds = [];
        const doingIds = [];
        
        data.tasks.forEach(task => {
          tasksById[task.id] = task;
          if (task.status === 'todo') {
            todoIds.push(task.id);
          } else if (task.status === 'doing') {
            doingIds.push(task.id);
          }
        });
        
        setTasks(tasksById);
        setColumns({
          'todo': {
            ...columns.todo,
            taskIds: todoIds
          },
          'doing': {
            ...columns.doing,
            taskIds: doingIds
          }
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Handle drag end
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Get source and destination columns
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    // Create new arrays for task IDs
    const sourceTaskIds = Array.from(sourceColumn.taskIds);
    sourceTaskIds.splice(source.index, 1);
    
    // If same column
    if (source.droppableId === destination.droppableId) {
      sourceTaskIds.splice(destination.index, 0, draggableId);
      
      const newColumns = {
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          taskIds: sourceTaskIds
        }
      };
      
      setColumns(newColumns);
    } else {
      // If different columns
      const destTaskIds = Array.from(destColumn.taskIds);
      destTaskIds.splice(destination.index, 0, draggableId);
      
      const newColumns = {
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          taskIds: sourceTaskIds
        },
        [destination.droppableId]: {
          ...destColumn,
          taskIds: destTaskIds
        }
      };
      
      setColumns(newColumns);
      
      // Update task status in backend
      try {
        await fetch(`http://localhost:8000/api/tasks/${draggableId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: destination.droppableId })
        });
        
        // Update local task status
        setTasks({
          ...tasks,
          [draggableId]: {
            ...tasks[draggableId],
            status: destination.droppableId
          }
        });
      } catch (err) {
        setError('Failed to update task status');
        // Revert to previous state if API call fails
        setColumns({
          ...columns
        });
      }
    }
  };

  // Add new task
  const handleAddTask = async (columnId) => {
    if (!newTaskText.trim()) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newTaskText,
          status: columnId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      
      const newTask = await response.json();
      
      // Update local state
      const newTaskId = newTask.id;
      const newTasks = {
        ...tasks,
        [newTaskId]: newTask
      };
      
      const column = columns[columnId];
      const newTaskIds = Array.from(column.taskIds);
      newTaskIds.push(newTaskId);
      
      setTasks(newTasks);
      setColumns({
        ...columns,
        [columnId]: {
          ...column,
          taskIds: newTaskIds
        }
      });
      
      setNewTaskText('');
      setAddingTo(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId, columnId) => {
    try {
      await fetch(`http://localhost:8000/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      // Update local state
      const newTasks = { ...tasks };
      delete newTasks[taskId];
      
      const column = columns[columnId];
      const newTaskIds = column.taskIds.filter(id => id !== taskId);
      
      setTasks(newTasks);
      setColumns({
        ...columns,
        [columnId]: {
          ...column,
          taskIds: newTaskIds
        }
      });
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // Render loading state
  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="task-board">
      <h1>THE DUDE'S TASKS</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns-container">
          {Object.values(columns).map(column => (
            <div className="column" key={column.id}>
              <h2>{column.title}</h2>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {column.taskIds.map((taskId, index) => {
                      const task = tasks[taskId];
                      return (
                        <Draggable key={taskId} draggableId={taskId} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <div className="task-content">{task.content}</div>
                              <button 
                                className="delete-task-btn"
                                onClick={() => handleDeleteTask(taskId, column.id)}
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              {addingTo === column.id ? (
                <div className="add-task-form">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Enter task..."
                    autoFocus
                  />
                  <div className="add-task-buttons">
                    <button 
                      className="add-task-submit"
                      onClick={() => handleAddTask(column.id)}
                    >
                      Add
                    </button>
                    <button 
                      className="add-task-cancel"
                      onClick={() => {
                        setAddingTo(null);
                        setNewTaskText('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="add-task-btn"
                  onClick={() => setAddingTo(column.id)}
                >
                  + Add Task
                </button>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>
      
      <div className="board-footer">
        <button className="back-btn" onClick={() => window.history.back()}>
          Back to Stopwatch
        </button>
      </div>
    </div>
  );
};

export default TaskBoard; 