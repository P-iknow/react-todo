import React from 'react';
import './Subtitle.scss';
import { IoIosArrowDown } from 'react-icons/io';

const Subtitle = ({ folded, onFold }) => {
  return (
    <div className="subTitle">
      <div className="name">TODO ITEMS</div>
      <IoIosArrowDown
        className={`fold ${folded ? 'rotate' : ''}`}
        onClick={() => {
          onFold();
        }}
      />
    </div>
  );
};

export default Subtitle;
