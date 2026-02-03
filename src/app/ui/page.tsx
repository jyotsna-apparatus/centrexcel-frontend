import { Button } from '@/components/ui/button'
import React from 'react'

const page = () => {
  return (
    <div className='parent'>
        <div className='container flex flex-col gap-4 items-start'>
            <h1 className='h1'>lorem ipsum dolor sit amet</h1>
            <h2 className='h2'>lorem ipsum dolor sit amet</h2>
            <h3 className='h3'>lorem ipsum dolor sit amet</h3>


            
            <p className='p1'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius repudiandae laborum libero, id dignissimos quisquam non cupiditate reprehenderit soluta sunt officia! Deleniti ipsum quisquam officiis? Explicabo, repellat harum! Consectetur quis aperiam, libero eligendi corporis obcaecati ullam eum explicabo sint eos molestias omnis est voluptas fugiat corrupti. Reprehenderit molestiae voluptatum neque id nesciunt quis voluptatibus eos laudantium ipsa nostrum illo aliquam, accusantium minima repellendus facilis dicta sed eius assumenda magnam corporis hic! Non porro sapiente quis quisquam laborum necessitatibus repudiandae nesciunt mollitia consectetur corrupti esse, iure facere odit! Similique facilis vitae optio aut quae! Nulla magni odio voluptatum dolor. Dolore nam aspernatur dolorum ad veniam, voluptates quos unde consequuntur corporis, at commodi maxime quia. In, illum quibusdam? Impedit, delectus quaerat ducimus rem sequi saepe aliquid repellendus incidunt dolore obcaecati temporibus maiores illo sapiente officiis quas praesentium libero adipisci facilis iusto magni est! Consequuntur iste est officiis nihil, atque quasi provident cumque! Magni laborum sit aspernatur maiores consequatur maxime architecto quas veritatis autem. Numquam, porro repudiandae placeat temporibus exercitationem maiores, fugit sint magnam illum quia necessitatibus ipsam saepe maxime error facere accusantium aliquam adipisci aspernatur deserunt. Ducimus eius consectetur nemo reiciendis aspernatur culpa, magni illo reprehenderit quidem earum nesciunt, ratione accusantium. Ab.</p>


            <div className="card">
                <h3 className="h3"> card title</h3>

                <p className="p1">Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa ea, omnis velit culpa labore blanditiis necessitatibus iusto perspiciatis sit autem, laboriosam nisi aliquid. At laboriosam minima blanditiis, adipisci eligendi eum eius corporis sunt atque assumenda earum magni iste placeat rerum!
                </p>
            </div>

            <Button variant="default">Click me</Button>
            <Button variant="destructive">Click me</Button>
            <Button variant="outline">Click me</Button>
            
   
        </div>
    </div>
  )
}

export default page