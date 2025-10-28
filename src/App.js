import { useState } from 'react';
import './App.css';
import CV from '../src/20210401_RAKANSHAKER_RESUME.pdf'
import avatarLookingDown from '../src/rakan_8bit_looking_down.svg'
import avatarEyesClosed from '../src/rakan_8bit_eyes_closed.svg'

const handleBlink = (setState, state) => {
  setTimeout(() => {
    setState(!state)
  }, state ? 250 : 4000);
};

const App = () => {

  const [isBlinking, setIsBlinking] = useState(false);

  handleBlink(setIsBlinking, isBlinking);

  return (
      <div className='App'>
        <div className='leftSide'>
          <div className='titleContainer'>
            <p className='rakanshaker'>Rakan Shaker</p>
            <p className='engineer'>Full Stack Engineer</p>
          </div>
          <div>
            <div className='leftSide__cvButton'>
            <a href={CV} download><button>Download My CV</button></a>
            </div>
          </div>
        </div>
        <div className='rightSide'>
          <div className='avatarContainer'>
            <img alt='Rakan!' className='avatarImage' src={isBlinking ? avatarEyesClosed : avatarLookingDown}/>
          </div>
          </div>
    </div>
  );
};

export default App;
