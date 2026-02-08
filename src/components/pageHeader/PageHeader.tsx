import React from 'react'

const PageHeader = ({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) => {
    return (
        <header className='flex items-end justify-between border-b border-cs-primary mb-4 pb-4'>
            <div className="flex flex-col gap-1">
                <h1 className="h3 text-cs-heading">{title}</h1>
                <p className="p1 ext-cs-text">{description}</p>
            </div>
            {children}
        </header>
    )
}

export default PageHeader