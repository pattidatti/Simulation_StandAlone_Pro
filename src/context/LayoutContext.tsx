
import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
    setFullWidth: (value: boolean) => void;
    setHideHeader: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({
    setFullWidth: () => {},
    setHideHeader: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fullWidth, setFullWidth] = useState(false);
    const [hideHeader, setHideHeader] = useState(false);

    return (
        <LayoutContext.Provider value={{ setFullWidth, setHideHeader }}>
            {children}
        </LayoutContext.Provider>
    );
};
