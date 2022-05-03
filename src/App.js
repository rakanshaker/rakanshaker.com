import { useState } from 'react';
import './App.css';
import CV from '../src/headshot_nobg.png'
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
            <p className='engineer'>Front End Engineer</p>
          </div>
          <div>
          <a href={CV} download><button className='leftSide__cvButton'>Download My CV</button></a>
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