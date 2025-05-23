import React from "../react";
import { useInsertionEffect, useLayoutEffect, useState } from "../hooks";

function DeleteChild() {
  useInsertionEffect(() => {
    console.log("useInsertionEffect child create");
    return () => {
      console.log("useInsertionEffect child destroy");
    };
  }, []);

  useLayoutEffect(() => {
    console.log("useLayoutEffect child create");
    return () => {
      console.log("useLayoutEffect child destroy");
    };
  }, []);
  return <h2>delete child</h2>;
}

function Parent() {
  useInsertionEffect(() => {
    console.log("useInsertionEffect parent create");
    return () => {
      console.log("useInsertionEffect parent destroy");
    };
  }, []);

  useLayoutEffect(() => {
    console.log("useLayoutEffect parent create");
    return () => {
      console.log("useLayoutEffect parent destroy");
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

  useInsertionEffect(() => {
    console.log("useInsertionEffect App create");
    return () => {
      console.log("useInsertionEffect App destroy");
    };
  }, [count]);

  useLayoutEffect(() => {
    console.log("useLayoutEffect App create");
    return () => {
      console.log("useLayoutEffect App destroy");
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
