import { useState, useEffect, useRef } from 'react'
import './App.css'
import Plant3D from './components/Plant3D'
import { Link } from 'react-router-dom'

function App() {
  const [time, setTime] = useState('00:00:00.000')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)
  const [timeRecords, setTimeRecords] = useState([])
  const [showRecords, setShowRecords] = useState(false)
  const [showThoughtModal, setShowThoughtModal] = useState(false)
  const [currentThought, setCurrentThought] = useState('')
  const [currentRecordId, setCurrentRecordId] = useState(null)
  const thoughtInputRef = useRef(null)

  const API_URL = 'http://localhost:8000'

  // Add Roboto font
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono:wght@300;400&display=swap'
    document.head.appendChild(link)
    
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Focus the thought input when modal opens
  useEffect(() => {
    if (showThoughtModal && thoughtInputRef.current) {
      setTimeout(() => {
        thoughtInputRef.current.focus()
      }, 100)
    }
  }, [showThoughtModal])

  // Fetch current time from the API
  const fetchTime = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stopwatch/time`)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setTime(data.formatted_time)
      setIsRunning(data.is_running)
    } catch (error) {
      console.error('Error fetching time:', error)
      setError('Failed to connect to the server')
    }
  }

  // Fetch time records
  const fetchTimeRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stopwatch/records`)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setTimeRecords(data.records)
    } catch (error) {
      console.error('Error fetching time records:', error)
      setError('Failed to fetch time records')
    }
  }

  // Start the stopwatch
  const handleStart = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stopwatch/start`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setTime(data.formatted_time)
      setIsRunning(true)
    } catch (error) {
      console.error('Error starting stopwatch:', error)
      setError('Failed to start the stopwatch')
    }
  }

  // Stop the stopwatch
  const handleStop = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stopwatch/stop`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setTime(data.formatted_time)
      setIsRunning(false)
      
      // Fetch updated time records after stopping
      await fetchTimeRecords()
      
      // Get the latest record ID and open the thought modal
      const recordsResponse = await fetch(`${API_URL}/api/stopwatch/records`)
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        if (recordsData.records.length > 0) {
          const latestRecord = recordsData.records[recordsData.records.length - 1]
          setCurrentRecordId(latestRecord.id)
          setShowThoughtModal(true)
        }
      }
    } catch (error) {
      console.error('Error stopping stopwatch:', error)
      setError('Failed to stop the stopwatch')
    }
  }

  // Reset the stopwatch
  const handleReset = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stopwatch/reset`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setTime(data.formatted_time)
    } catch (error) {
      console.error('Error resetting stopwatch:', error)
      setError('Failed to reset the stopwatch')
    }
  }

  // Clear all time records
  const handleClearRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stopwatch/records`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      setTimeRecords([])
    } catch (error) {
      console.error('Error clearing time records:', error)
      setError('Failed to clear time records')
    }
  }

  // Toggle showing records
  const toggleRecords = async () => {
    if (!showRecords) {
      await fetchTimeRecords()
    }
    setShowRecords(!showRecords)
  }

  // Submit thought
  const handleThoughtSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentThought.trim()) {
      setShowThoughtModal(false)
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/api/stopwatch/thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thought: currentThought,
          record_id: currentRecordId
        }),
      })
      
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      
      // Update the records with the new thought
      await fetchTimeRecords()
      
      // Close the modal and reset the thought
      setShowThoughtModal(false)
      setCurrentThought('')
    } catch (error) {
      console.error('Error saving thought:', error)
      setError('Failed to save your thought')
    }
  }

  // Close thought modal without saving
  const handleCloseThoughtModal = () => {
    setShowThoughtModal(false)
    setCurrentThought('')
  }

  // Poll the API for time updates when the stopwatch is running
  useEffect(() => {
    // Initial fetch when component mounts
    fetchTime()

    let interval
    if (isRunning) {
      interval = setInterval(fetchTime, 100) // Update every 100ms for smooth display
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning])

  // Calculate total seconds from all records for plant growth
  const calculateTotalSeconds = () => {
    if (!timeRecords || timeRecords.length === 0) return 0;
    return timeRecords.reduce((total, record) => total + record.elapsed_time, 0);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Lebowski Stopwatch</h1>
      </header>
      
      <div className="main-layout">
        {/* New Navigation Panel */}
        <div className="nav-panel">
          <h3>Navigation</h3>
          <div className="nav-buttons">
            <Link to="/" className="nav-btn active">
              STOPWATCH
            </Link>
            <Link to="/tasks" className="nav-btn">
              TASK BOARD
            </Link>
            {/* Future buttons can be added here */}
          </div>
        </div>
        
        <div className="container">
          <div className="stopwatch-container">
            <div>
              <img 
                src="https://i.imgur.com/TJZJ8xS.jpeg" 
                className="lebowski-logo" 
                alt="The Big Lebowski" 
              />
            </div>
            <h1>THE DUDE'S STOPWATCH</h1>
            
            <div className="card">
              {error && <div className="error-message">{error}</div>}
              <div className="stopwatch-display">{time}</div>
              <div className="stopwatch-controls">
                {!isRunning ? (
                  <button onClick={handleStart} className="start-btn">
                    START
                  </button>
                ) : (
                  <button onClick={handleStop} className="stop-btn">
                    STOP
                  </button>
                )}
                <button onClick={handleReset} className="reset-btn">
                  RESET
                </button>
                <button onClick={toggleRecords} className="records-btn">
                  {showRecords ? 'HIDE TIMES' : 'SHOW TIMES'}
                </button>
              </div>
              
              {showRecords && (
                <div className="time-records">
                  <h2>RECORDED TIMES</h2>
                  {timeRecords.length === 0 ? (
                    <p className="no-records">No times recorded yet</p>
                  ) : (
                    <>
                      <ul>
                        {timeRecords.map((record) => (
                          <li key={record.id}>
                            <div className="record-main">
                              <span className="record-time">{record.formatted_time}</span>
                              <span className="record-date">
                                {new Date(record.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {record.thought && (
                              <div className="record-thought">
                                <span className="thought-label">Thought:</span>
                                <p className="thought-content">{record.thought}</p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={handleClearRecords} 
                        className="clear-records-btn"
                      >
                        CLEAR ALL
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <p className="read-the-docs">
              THE DUDE ABIDES
            </p>
          </div>
          
          {/* Plant container */}
          <div className="plant-container">
            <h2>Your Growth Garden</h2>
            <p>Plant grows with every 20 seconds recorded</p>
            <Plant3D totalSeconds={calculateTotalSeconds()} />
          </div>
          
          {/* Thought Modal */}
          {showThoughtModal && (
            <div className="modal-overlay">
              <div className="thought-modal">
                <h2>What's on your mind?</h2>
                <form onSubmit={handleThoughtSubmit}>
                  <textarea
                    ref={thoughtInputRef}
                    value={currentThought}
                    onChange={(e) => setCurrentThought(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={5}
                  />
                  <div className="modal-buttons">
                    <button 
                      type="button" 
                      onClick={handleCloseThoughtModal}
                      className="modal-cancel-btn"
                    >
                      SKIP
                    </button>
                    <button 
                      type="submit"
                      className="modal-submit-btn"
                    >
                      SAVE
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
