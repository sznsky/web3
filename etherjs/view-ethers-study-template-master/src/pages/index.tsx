import { useEffect} from 'react';
import yayJpg from '../assets/yay.jpg';
import {ethers} from 'ethers';

export default function HomePage() {
    useEffect(() => {
        let provider = new ethers.BrowserProvider(window?.ethereum);
        provider.getBalance("0x137ff0b988d53Ae911be8B395f0337Ca2d4c8760").then(res => {
            console.log("getBalance : ", res);
        })
    }, []);


  return (
    <div>
      <h2>Yay! Welcome to umi!</h2>
      <p>
        <img src={yayJpg} width="388" />
      </p>
      <p>
        To get started, edit <code>pages/index.tsx</code> and save to reload.
      </p>
    </div>
  );
}
