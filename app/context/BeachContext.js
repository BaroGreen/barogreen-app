// app/context/BeachContext.js
import React,{createContext,useState} from 'react';

export const BeachContext=createContext();

export const BeachProvider=({children})=>{
  const [selectedBeachImage,setSelectedBeachImage]=useState(null);
  return (<BeachContext.Provider value={{selectedBeachImage,setSelectedBeachImage}}>{children}</BeachContext.Provider>);
};
