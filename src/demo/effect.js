import React from "../react";
import { useEffect, useState } from "../hooks";

function DeleteChild() {
  useEffect(() => {
    console.log("useEffect child create");
    return () => {
      console.log("useEffect child destroy");
    };
  }, []);

  return <h2>delete child</h2>;
}

function Parent() {
  useEffect(() => {
    console.log("useEffect parent create");
    return () => {
      console.log("useEffect parent destroy");
    };
  }, []);

  return (
    <div>
      <h1>delete parent</h1>
      <DeleteChild />
    </div>
  );
}

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("useEffect App", count);
    return () => {
      console.log("useEffect App destroy");
    };
  }, [count]);

  return (
    <div>
      {count < 2 && <Parent />}
      <h1>count:{count}</h1>
      <button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        click
      </button>
    </div>
  );
}
