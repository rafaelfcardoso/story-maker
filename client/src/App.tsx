import { useState, useEffect, useRef } from 'react';
import './App.css';

// TYPE DEFINITIONS
interface Scene {
  id: string;
  description: string;
  dialogue?: string;
  narration?: string;
  image_url: string | null;
}

interface Story {
  title: string;
  scenes: Scene[];
}

// Explicit type for wizard steps
export type WizardStep = 'briefing' | 'proposal' | 'sceneCount' | 'story' | 'style' | 'images';

// Helper function to generate HTML for the story
const generateStoryHTML = (story: Story): string => {
  const storyTitle = story.title || 'My Story';
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${storyTitle}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 20px;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: auto;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h1, h2 {
      color: #333;
      text-align: center;
    }
    .scene {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .scene:last-child {
      border-bottom: none;
    }
    .scene h3 {
      color: #555;
    }
    .scene img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin-top: 10px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    p {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${storyTitle}</h1>
`;

  story.scenes.forEach((scene, index) => {
    html += `
    <div class="scene">
      <h2>Scene ${index + 1}</h2>
      <p><strong>Description:</strong> ${scene.description || 'N/A'}</p>
`;
    if (scene.dialogue) {
      html += `      <p><strong>Dialogue:</strong> ${scene.dialogue}</p>
`;
    }
    if (scene.narration) {
      html += `      <p><strong>Narration:</strong> ${scene.narration}</p>
`;
    }
    if (scene.image_url) {
      html += `      <img src="${scene.image_url}" alt="Scene ${
        index + 1
      } Visual">
`;
    }
    html += `    </div>
`;
  });

  html += `
  </div>
</body>
</html>
`;
  return html;
};

function App() {
  const [briefing, setBriefing] = useState('');
  const [numScenes, setNumScenes] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type Message = { role: 'user' | 'system'; content: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<WizardStep>('briefing');
  const [pendingProposal, setPendingProposal] = useState<Story | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [isStoryPaneOpen, setIsStoryPaneOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0); // For active scene indicator
  const storyPanelRef = useRef<HTMLDivElement | null>(null); // Ref for the story panel (scroll root)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsStoryPaneOpen(false); // Default to closed on mobile
      } else {
        setIsStoryPaneOpen(true); // Default to open on desktop
      }
    };
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Effect to reset activeSceneIndex to 0 when a new story is loaded
  useEffect(() => {
    if (story && story.scenes && story.scenes.length > 0) {
      setActiveSceneIndex(0);
      storyPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [story]); // Dependency: re-run only when the story object itself changes

  const handleMainFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'briefing') {
      if (!briefing.trim()) return;
      setLoading(true);
      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: briefing }]);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/story`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefing, numScenes }),
        });
        if (!res.ok) throw new Error('Failed to generate story proposal.');
        const data = await res.json();
        setPendingProposal({
          title: briefing, // Use original briefing as a placeholder title
          scenes: Array.isArray(data.story) ? data.story : [],
        });
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content:
              'Here is a proposed story based on your briefing. Would you like to adjust it or proceed?',
          },
        ]);
        setStep('proposal');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unknown error occurred while generating proposal.'
        );
      } finally {
        setLoading(false);
      }
    } else if (step === 'style') {
      if (!selectedStyle.trim()) {
        setError('Please select or type a style.'); // Ensure a style is selected or typed
        return;
      }
      setError(null); // Clear previous errors
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: `Chosen style: ${selectedStyle}` },
      ]);
      // Directly call handleGenerateImages, assuming it handles its own loading/error states
      await handleGenerateImages();
    }
    // Add other steps like 'sceneCount' if they also use this main submit button
  };

  const handleApproveProposal = () => {
    if (!pendingProposal) return;
    // Use pendingProposal.scenes directly if they are already detailed
    // Or, if they are just titles/summaries, this is where you might fetch full scene details
    setStory({
      title: pendingProposal.title,
      scenes: pendingProposal.scenes.map((proposalScene, index) => ({
        id: `scene-${index}`,
        description: proposalScene.description, // Use actual description from proposal
        narration: proposalScene.narration || '', // Use actual narration or fallback
        dialogue: proposalScene.dialogue || '', // Use actual dialogue or fallback
        image_url: null,
      })),
    });
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: 'system',
        content: "Great! Now, let's choose a visual style for the images.",
      },
    ]);
    setStep('style');
    setPendingProposal(null); // Clear pending proposal
  };

  const handleSceneCountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setLoading(true); // Consider if a loading state is needed here
    // setError(null);

    // Validate numScenes (already implicitly handled by input type='number' min='1')
    if (numScenes < 1) {
      // setError('Number of scenes must be at least 1.'); // Or rely on form validation
      // return;
    }

    // Add user's choice to messages for context
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `Let's go with ${numScenes} scene${numScenes > 1 ? 's' : ''}.`,
      },
    ]);

    // Transition to the next step - assuming 'style' selection as per flow.
    // If detailed scenes were to be fetched here based on count, that logic would go here.
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: 'system',
        content: "Great! Now, let's choose a visual style for the images.",
      },
    ]);
    setStep('style');
    // setLoading(false);
  };

  const handleGenerateImages = async () => {
    if (!story || !story.scenes || story.scenes.length === 0) {
      setError('Cannot generate images without scenes in the story.');
      return;
    }
    if (!selectedStyle) {
      setError('Please select a style before generating images.');
      return;
    }

    setImageLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `Generate images for the story in a ${selectedStyle} style.`,
      },
      { role: 'system', content: 'Generating images, please wait...' },
    ]);
    setError(null);

    try {
      const imageGenerationPromises = story.scenes.map(async (scene) => {
        const response = await fetch('http://localhost:3001/api/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sceneDescription: scene.description,
            style: selectedStyle,
          }),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error('Error parsing error response:', parseError); // Added logging
            // If parsing errorData fails, throw a generic error with status
            throw new Error(
              `HTTP error! status: ${response.status} for scene: ${scene.id}`
            );
          }
          // If errorData is parsed, use its message or fall back to status
          throw new Error(
            errorData.error ||
              `HTTP error! status: ${response.status} for scene: ${scene.id}`
          );
        }
        const data = await response.json(); // Server returns { imageUrl: string }
        return { sceneId: scene.id, imageUrl: data.imageUrl }; // Return sceneId to map back
      });

      const generatedImagesData = await Promise.all(imageGenerationPromises);

      // Update the main story state with the new image URLs
      setStory((prevStory) => {
        if (!prevStory) return null; // Should not happen if we checked story above
        const updatedScenes = prevStory.scenes.map((scene) => {
          const imageData = generatedImagesData.find(
            (img) => img.sceneId === scene.id
          );
          return imageData
            ? { ...scene, image_url: imageData.imageUrl }
            : scene;
        });
        return { ...prevStory, scenes: updatedScenes };
      });

      // Update the separate imageUrls state as well, if still used by UI
      // This might be simplified later if UI directly uses story.scenes[X].image_url
      const allImageUrls = generatedImagesData
        .map((data) => data.imageUrl)
        .filter((url) => url) as string[];
      setImageUrls(allImageUrls);

      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Here are the generated images for your story in a ${selectedStyle} style!`,
        },
      ]);
      setStep('images'); // Or 'story' if images are displayed within the story view
    } catch (err: unknown) {
      console.error('Error generating images:', err);
      let errorMessage =
        'Failed to generate images. Please check the server logs.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Sorry, I encountered an error generating images: ${errorMessage}`,
        },
      ]);
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background:
          'radial-gradient(ellipse at 70% 20%, #232a3a 60%, #171c2c 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 10,
          padding: '32px 40px 24px 40px',
          background: 'none',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box', // Ensure padding is included in width calculation
        }}
      >
        <h1
          className="app-title"
          style={{
            margin: 0,
            fontSize: '2.2rem',
            color: '#fff',
            textShadow: '0 0 16px #00f0c8',
            letterSpacing: 1,
          }}
        >
          Choose Your Story
        </h1>
        {isMobile && (
          <button
            onClick={() => setIsStoryPaneOpen(!isStoryPaneOpen)}
            className="story-toggle-btn"
            style={{
              background: '#00f0c8',
              color: '#171c2c',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          >
            {isStoryPaneOpen ? 'Hide Story' : 'Show Story'}
          </button>
        )}
      </header>
      <main
        style={{
          flex: 1,
          width: 'calc(100% - 80px)', // Account for side padding
          maxWidth: 1600, // Increased max-width for a spacious two-panel layout
          margin: '0 auto', // Center the main content area
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row', // Stack panels on mobile
          position: 'relative',
          minHeight: 0, // Essential for internal scrolling within flex children
          gap: '24px', // Space between the chat and story panels
          padding: '0 40px 24px 40px', // Padding for the main content area
        }}
      >
        {/* Left Panel: Chat Interface */}
        <div
          className="chat-panel"
          style={{
            flex: 1, // Chat panel always participates in flex distribution
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0, // Allow chat panel to shrink and scroll internally
            background: 'rgba(30, 35, 50, 0.4)', // Semi-transparent background for the panel
            borderRadius: '20px',
            padding: '20px', // Padding for the chat panel content
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
            color: '#e8e8e8', // Lighter text color for readability
            overflowY: 'auto', // Enable scrolling for story content if it overflows
            height: isMobile ? (isStoryPaneOpen ? '50vh' : 'auto') : 'auto', // Control height on mobile; 'auto' allows it to fill when story is closed
            marginBottom: isMobile && isStoryPaneOpen ? '24px' : '0',
          }}
        >
          <div
            className="messages-container"
            style={{
              flexGrow: 1,
              overflowY: 'auto',
              marginBottom: '20px', // Space above the input area
              paddingRight: '10px', // Ensure scrollbar doesn't overlap content too much
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent:
                    msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'rgba(0, 240, 200, 0.2)'
                        : 'rgba(255, 255, 255, 0.09)',
                    color: '#fff',
                    padding: '12px 18px',
                    borderRadius: 18,
                    maxWidth: '85%',
                    fontSize: '1.05rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                    border:
                      msg.role === 'user'
                        ? '1px solid rgba(0, 240, 200, 0.35)'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                    whiteSpace: 'pre-wrap', // Preserve formatting like newlines
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {step === 'proposal' && pendingProposal && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.09)',
                    color: '#fff',
                    padding: '12px 18px',
                    borderRadius: 18,
                    maxWidth: '85%',
                    fontSize: '1.05rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <strong>Story Proposal: {pendingProposal.title}</strong>
                  <ul style={{ paddingLeft: '20px', margin: '10px 0 0 0' }}>
                    {pendingProposal.scenes.map((scene, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>
                        {scene.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {step === 'proposal' && !loading && (
              <div
                className="message system-actions"
                style={{
                  width: '100%', // Ensure the message bubble itself takes full available width
                  boxSizing: 'border-box', // Include padding/border in width calculation
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '10px',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                    padding: '0 10px', // Apply horizontal padding here
                    width: '100%', // Ensure this flex container takes full width of its parent
                    boxSizing: 'border-box', // Include its own padding in its width calculation
                  }}
                >
                  <button
                    onClick={handleApproveProposal}
                    className="chat-button"
                    disabled={loading}
                  >
                    Approve & Set Scenes
                  </button>
                  <button
                    onClick={() => alert('Adjust flow coming soon!')}
                    className="chat-button secondary"
                    disabled={loading}
                  >
                    Adjust Proposal
                  </button>
                </div>
              </div>
            )}
            {loading && !imageLoading && (
              <p
                style={{
                  color: '#00f0c8',
                  textAlign: 'center',
                  padding: '10px 0',
                }}
              >
                Generating proposal...
              </p>
            )}
            {error && (
              <p
                style={{
                  color: '#ff7b7b',
                  textAlign: 'center',
                  padding: '10px 0',
                }}
              >
                Error: {error}
              </p>
            )}
          </div>

          {/* Main input form - HIDE if step is 'sceneCount' */}
          {step !== 'sceneCount' && (
            <form
              onSubmit={handleMainFormSubmit} // Use the new unified handler
              style={{
                display: 'flex',
                alignItems: 'flex-start', // Align items to the start for multi-line textarea
                marginTop: 'auto', // Push to bottom if messages-container doesn't fill space
                width: '100%', // Ensure form takes full width of chat-panel's content box
                boxSizing: 'border-box', // Ensure form's padding/border are within its 100% width
              }}
            >
              {step === 'briefing' && (
                <textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  placeholder="Tell me about the story you want to create...\nE.g., A brave knight, a mysterious forest, and a hidden treasure."
                  rows={4}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    borderRadius: 10,
                    padding: '10px 12px',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: '1.13rem',
                    resize: 'none',
                    marginBottom: 8,
                    boxSizing: 'border-box',
                  }}
                />
              )}
              {step === 'proposal' && (
                <input
                  type="number"
                  value={numScenes}
                  onChange={(e) =>
                    setNumScenes(parseInt(e.target.value, 10) || 1)
                  }
                  min="1"
                  max="10" // Example max
                  placeholder="Number of scenes (e.g., 3)"
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    borderRadius: 10,
                    padding: '10px 12px',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: '1.13rem',
                    marginBottom: 8,
                    boxSizing: 'border-box',
                  }}
                />
              )}
              {step === 'style' && (
                <div
                  className="chat-form"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%', // Ensure the div itself takes full width
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {['Cinematic', 'Anime', 'Watercolor', 'Pixel Art'].map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedStyle(s)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border:
                              selectedStyle === s
                                ? '2px solid #00f0c8'
                                : '2px solid #444858',
                            background:
                              selectedStyle === s
                                ? 'rgba(0, 240, 200, 0.2)'
                                : 'rgba(50,55,70,0.7)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {s}
                        </button>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    placeholder="Type a style or select above..."
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      borderRadius: 10,
                      padding: '10px 12px',
                      background: 'transparent',
                      color: '#fff',
                      fontSize: '1.13rem',
                      marginBottom: 8,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  marginTop: 2,
                }}
              >
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#b0b3c3',
                    cursor: 'pointer',
                    fontSize: 20,
                    padding: 0,
                    opacity: 0.92,
                  }}
                  title="Add Attachment (placeholder)"
                >
                  ＋
                </button>
                <div style={{ flex: 1 }} /> {/* Spacer */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    imageLoading ||
                    (!briefing.trim() && step === 'briefing') ||
                    (step === 'proposal' && numScenes < 1) ||
                    (step === 'style' && !selectedStyle.trim())
                  }
                  style={{
                    background: '#00f0c8',
                    border: 'none',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 8,
                    boxShadow: '0 2px 8px #00f0c822',
                    cursor:
                      loading ||
                      imageLoading ||
                      (!briefing.trim() && step === 'briefing') ||
                      (step === 'proposal' && numScenes < 1) ||
                      (step === 'style' && !selectedStyle.trim())
                        ? 'not-allowed'
                        : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  title="Send"
                >
                  <span style={{ fontSize: 22, color: '#222' }}>➤</span>
                </button>
              </div>
            </form>
          )}
          {/* Dedicated Scene Count Form - SHOW if step is 'sceneCount' */}
          {step === 'sceneCount' && (
            <form
              onSubmit={handleSceneCountSubmit} // Use the new handler
              className="scene-count-form" // Add a class for potential styling
              style={{
                padding: '10px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <label
                htmlFor="scene-count-input"
                style={{ color: '#ccc', fontSize: '0.9em' }}
              >
                Number of Scenes:
              </label>
              <input
                type="number"
                id="scene-count-input"
                value={numScenes}
                onChange={(e) =>
                  setNumScenes(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                min="1"
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #555',
                  background: '#333',
                  color: '#fff',
                  width: '60px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 15px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#00f0c8',
                  color: '#222',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Set Scenes
              </button>
            </form>
          )}
        </div>

        {/* Right Panel: Story Content */}
        {((isMobile && isStoryPaneOpen) || !isMobile) && (
          <div
            ref={storyPanelRef}
            className="story-panel"
            style={{
              flex: 1, // Story panel takes up 1 part of the flex space
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(20, 24, 34, 0.6)', // Reverted to original distinct background for story content
              borderRadius: '20px',
              padding: '25px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
              color: '#e8e8e8', // Lighter text color for readability
              overflowY: 'auto', // Enable scrolling for story content if it overflows
              height: isMobile ? 'auto' : 'auto', // Control height on mobile
            }}
          >
            <h2
              style={{
                color: '#00f0c8',
                textAlign: 'center',
                marginTop: 0,
                marginBottom: '25px',
                borderBottom: '1px solid rgba(0, 240, 200, 0.3)',
                paddingBottom: '15px',
                letterSpacing: '0.5px',
              }}
            >
              Your Story
            </h2>

            {!story && imageUrls.length === 0 && !imageLoading && (
              <p
                style={{
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '1.1em',
                  marginTop: '30px',
                }}
              >
                The story content and generated images will appear here as you
                progress.
              </p>
            )}

            {/* Render story title and scene structure if story object exists, 
                detailed scene content will render based on its own availability. 
                This allows the panel to show the basic story structure earlier. */}
            {story && (
              <>
                {/* Scene Navigation Links */}
                {story.scenes && story.scenes.length > 1 && (
                  <div
                    className="scene-navigation"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      padding: '0 20px 20px 20px', // Match potential padding of story-content
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)', // Separator
                      marginBottom: '20px',
                    }}
                  >
                    {story.scenes.map((scene, index) => (
                      <button
                        key={scene.id}
                        onClick={() => {
                          setActiveSceneIndex(index);
                          // Scroll the storyPanelRef to the top, as new content is loaded
                          storyPanelRef.current?.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                          });
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor:
                            activeSceneIndex === index
                              ? 'rgba(0, 240, 200, 0.4)'
                              : 'rgba(0, 240, 200, 0.15)',
                          color:
                            activeSceneIndex === index ? '#ffffff' : '#00f0c8',
                          textDecoration: 'none',
                          borderRadius: '12px',
                          fontSize: '0.9em',
                          border:
                            activeSceneIndex === index
                              ? '1px solid #00f0c8'
                              : '1px solid rgba(0, 240, 200, 0.3)',
                          fontWeight:
                            activeSceneIndex === index ? 'bold' : 'normal',
                          transition:
                            'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, font-weight 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                          if (activeSceneIndex !== index) {
                            e.currentTarget.style.backgroundColor =
                              'rgba(0, 240, 200, 0.3)';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (activeSceneIndex !== index) {
                            e.currentTarget.style.backgroundColor =
                              'rgba(0, 240, 200, 0.15)';
                            e.currentTarget.style.color = '#00f0c8';
                          }
                        }}
                      >
                        Scene {index + 1}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className="story-panel-content"
                  style={{
                    padding: '0 20px 20px 20px',
                    // overflowY: 'auto', // Keep or remove based on desired scroll behavior for single scene
                    maxHeight: 'calc(100vh - 250px)', // Adjust as needed
                    textAlign: 'left',
                    position: 'relative', // For potential absolute positioned elements later
                  }}
                >
                  {(() => {
                    if (
                      !story ||
                      !story.scenes ||
                      story.scenes.length === 0 ||
                      activeSceneIndex >= story.scenes.length
                    ) {
                      return <p>Loading scene or scene not available...</p>;
                    }
                    const currentScene = story.scenes[activeSceneIndex];
                    if (!currentScene) return <p>Scene not found.</p>;

                    return (
                      <div
                        key={currentScene.id}
                        id={`scene-${activeSceneIndex}`}
                        style={{
                          padding: '20px',
                          border: '1px solid rgba(0, 240, 200, 0.1)',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          // No borderBottom here, as it's the only scene displayed
                        }}
                      >
                        <h4
                          style={{
                            color: '#00f0c8',
                            marginTop: 0,
                            marginBottom: '20px',
                            fontSize: '1.4em',
                            textAlign: 'center',
                            borderBottom: '1px solid rgba(0, 240, 200, 0.2)',
                            paddingBottom: '10px',
                          }}
                        >
                          Scene {activeSceneIndex + 1}
                        </h4>
                        {currentScene.image_url && (
                          <img
                            src={currentScene.image_url}
                            alt={`Image for Scene ${activeSceneIndex + 1}`}
                            style={{
                              width: '100%',
                              maxWidth: '450px',
                              height: 'auto',
                              borderRadius: '10px',
                              marginBottom: '20px',
                              display: 'block',
                              marginLeft: 'auto',
                              marginRight: 'auto',
                              border: '1px solid rgba(0, 240, 200, 0.4)',
                              boxShadow: '0 4px 15px rgba(0, 240, 200, 0.1)',
                            }}
                          />
                        )}
                        {currentScene.narration && (
                          <p
                            style={{
                              margin: '0 0 12px 0',
                              lineHeight: '1.7',
                              fontSize: '1.1em',
                              color: '#e0e0e0',
                            }}
                          >
                            <strong>Narration:</strong> {currentScene.narration}
                          </p>
                        )}
                        {currentScene.description && (
                          <p
                            style={{
                              margin: '0 0 12px 0',
                              lineHeight: '1.7',
                              fontSize: '1.1em',
                              color: '#e0e0e0',
                            }}
                          >
                            <strong>Description (for image prompt):</strong>{' '}
                            {currentScene.description}
                          </p>
                        )}
                        {currentScene.dialogue && (
                          <p
                            style={{
                              margin: '0 0 12px 0',
                              lineHeight: '1.7',
                              fontSize: '1.1em',
                              color: '#e0e0e0',
                            }}
                          >
                            <strong>Dialogue:</strong> {currentScene.dialogue}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {story && story.scenes && story.scenes.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '15px',
                  marginBottom: '20px',
                }}
              >
                <button
                  onClick={() => {
                    if (activeSceneIndex > 0) {
                      setActiveSceneIndex(activeSceneIndex - 1);
                      storyPanelRef.current?.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });
                    }
                  }}
                  disabled={activeSceneIndex === 0}
                  style={{
                    padding: '8px 18px',
                    fontSize: '1em',
                    backgroundColor:
                      activeSceneIndex === 0 ? '#444' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: activeSceneIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: activeSceneIndex === 0 ? 0.6 : 1,
                  }}
                >
                  Previous Scene
                </button>
                <button
                  onClick={() => {
                    if (activeSceneIndex < story.scenes.length - 1) {
                      setActiveSceneIndex(activeSceneIndex + 1);
                      storyPanelRef.current?.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });
                    }
                  }}
                  disabled={activeSceneIndex === story.scenes.length - 1}
                  style={{
                    padding: '8px 18px',
                    fontSize: '1em',
                    backgroundColor:
                      activeSceneIndex === story.scenes.length - 1
                        ? '#444'
                        : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor:
                      activeSceneIndex === story.scenes.length - 1
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      activeSceneIndex === story.scenes.length - 1 ? 0.6 : 1,
                  }}
                >
                  Next Scene
                </button>
              </div>
            )}
            {story && story.scenes && story.scenes.length > 0 && (
              <div
                className="export-story-section"
                style={{ marginTop: '20px', textAlign: 'center' }}
              >
                <button
                  onClick={() => {
                    const html = generateStoryHTML(story);
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${story.title}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  // Using existing button styles if available, or can add specific ones
                  // For consistency, let's assume general button styling will apply or use a common class
                >
                  Export Story as HTML
                </button>
              </div>
            )}
            {imageLoading && (
              <p
                style={{
                  color: '#00f0c8',
                  textAlign: 'center',
                  fontSize: '1.2em',
                  marginTop: '30px',
                  padding: '15px',
                }}
              >
                Generating images, please wait...
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
