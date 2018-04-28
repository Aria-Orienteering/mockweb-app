import React from 'react';
import PropTypes from 'prop-types';

export default function NameList({user})  {

        return (
            <span className="to">
                <span className="value">{user.firstName}</span>
            </span>
        );
    }

NameList.propTypes = {
    user: PropTypes.object.isRequired
};



