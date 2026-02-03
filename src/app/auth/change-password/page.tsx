import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import React from 'react'

const ChangePasswordPage = () => {
  return (
    <div className='parent h-[100dvh]'>
      <div className='container flex flex-col gap-4 items-center justify-center'>
        <div className='card flex flex-col gap-4 items-center justify-center'>
          <div className="flex flex-col items-center justify-center gap-2 my-5">
            <h1 className='h3'>Change password</h1>
            <p className="p1 text-center">Enter your new password below</p>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <Input type='password' placeholder='New password' />
            <Input type='password' placeholder='Confirm password' />
          </div>
          <Button className='w-full mt-4'>Update password</Button>
        </div>
        <p className='p1'><Link href='/auth/login' className='link-highlight !text-base'>Back to login</Link></p>
      </div>
    </div>
  )
}

export default ChangePasswordPage
