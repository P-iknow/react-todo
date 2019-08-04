/* eslint-disable dot-notation */

import React from 'react';
import './TodoListTemplate.scss';

// prettier-ignore
const TodoListTemplate = ({ form, children }) => {
  return (
    <main className='todo-list-template'>
      <div className='title'>
        Todo List
      </div>
      <section className='form-wrapper'>
        { form }
      </section>
      <section className='todos-wrapper'>
        { children }
      </section>
    </main>
  );
};

export default TodoListTemplate;
