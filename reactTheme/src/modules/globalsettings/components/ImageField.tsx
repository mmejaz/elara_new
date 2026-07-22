import { DeleteOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useState } from 'react'
import apiClient from '../../../services/apiClient'
import { toast } from '../../../utils/toast'

interface ImageFieldProps {
  value?: string
  onChange?: (url: string | undefined) => void
  appId: number
}

/** Controlled image input — uploads on select, stores the returned URL as the value. */
function ImageField({ value, onChange, appId }: ImageFieldProps) {
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    const form = new FormData()
    form.append('image', file)
    setUploading(true)
    try {
      const { data } = await apiClient.post(`/globalsettings/${appId}/upload`, form)
      onChange?.(data.data.url)
    } catch (error) {
      // The endpoint reports under `image`; the file layer reports under `file`.
      const data = (error as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } }
      })?.response?.data
      const msg = data?.errors?.file?.[0] ?? data?.errors?.image?.[0]
      toast.error(msg ?? 'Unable to upload image')
    } finally {
      setUploading(false)
    }
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    upload(file as File)
    return false // handle upload manually
  }

  if (value) {
    return (
      <div className="flex items-center gap-3">
        <img src={value} alt="" className="h-16 w-16 rounded border object-cover" />
        <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload}>
          <Button size="small" loading={uploading}>Replace</Button>
        </Upload>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange?.(undefined)} />
      </div>
    )
  }

  return (
    <Upload accept="image/*" listType="picture-card" showUploadList={false} beforeUpload={beforeUpload}>
      <div className="flex flex-col items-center">
        {uploading ? <LoadingOutlined /> : <PlusOutlined />}
        <span className="mt-1 text-xs">Upload</span>
      </div>
    </Upload>
  )
}

export default ImageField
