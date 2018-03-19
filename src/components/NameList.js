import React from 'react';
import PropTypes from 'prop-types';

export default function NameList({name})  {

        return (
            <span className="to">
                <span className="value">{name.to}</span>
            </span>
        );
    }

NameList.propTypes = {
    name: PropTypes.object.isRequired
};



