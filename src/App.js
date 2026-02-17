import './App.css';
import CV from './Rakan Shaker Software Engineer 2026.pdf'
import GamerAvatar from './components/GamerAvatar';

const App = () => {
  return (
    <div className='App'>
      <div className='leftSide'>
        <div className='titleContainer'>
          <p className='rakanshaker'>Rakan Shaker</p>
          <p className='engineer'>Full Stack Engineer</p>
        </div>
        <div>
          <div className='leftSide__cvButton'>
            <a href={CV} download="Rakan_Shaker_CV.pdf"><button>Download My CV</button></a>
          </div>
        </div>
      </div>
      <div className='rightSide'>
        <GamerAvatar className="avatarImage" />
      </div>
    </div>
  );
};

export default App;
