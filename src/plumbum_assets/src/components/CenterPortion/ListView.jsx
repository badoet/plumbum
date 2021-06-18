import React from "react";
import styled from 'styled-components';

// custom imports

// 3rd party imports
import * as streamSaver from 'streamsaver';
import { WritableStream } from 'web-streams-polyfill/ponyfill'
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from "@dfinity/auth-client";
import { idlFactory as plumbum_idl, canisterId as plumbum_id } from 'dfx-generated/plumbum';
import {useSelector, useDispatch} from 'react-redux';
import {filesUpdate} from '../../state/actions'
import {DownloadOutlined, DeleteOutlined, EditOutlined, BookOutlined} from "@ant-design/icons";
import {Table, Popconfirm, Space} from 'antd';

const ListView = () =>{

  const files = useSelector(state=>state.FileHandler.files)
  const dispatch = useDispatch();

  // For large files not working on firefox to be fixed
  /*const download = async (fileId, chunk_count, fileName) => {
    streamSaver.WritableStream = WritableStream
    streamSaver.mitm = 'http://localhost:8000/mitm.html'
    const fileStream = streamSaver.createWriteStream(fileName);
    const writer = fileStream.getWriter();
    for(let j=0; j<chunk_count; j++){
      const bytes = await plumbum.getFileChunk(fileId, j+1);
      //const bytesAsBuffer = Buffer.from(new Uint8Array(bytes[0]));
      const bytesAsBuffer = new Uint8Array(bytes[0]);
      writer.write(bytesAsBuffer);
    }
    writer.close();
  };*/

  //Temporary method works well on small files
  const download = async (fileId, chunk_count, fileName, mimeType) => {
    const authClient = await AuthClient.create();
    const identity = await authClient.getIdentity();
    const agent = new HttpAgent({ identity });
    const plumbum = Actor.createActor(plumbum_idl, { agent, canisterId: plumbum_id });

    const chunkBuffers = [];
    for(let j=0; j<chunk_count; j++){
      const bytes = await plumbum.getFileChunk(fileId, j+1);
      const bytesAsBuffer = new Uint8Array(bytes[0]);
      chunkBuffers.push(bytesAsBuffer);
    }
    
    const fileBlob = new Blob([Buffer.concat(chunkBuffers)], {
      type: mimeType,
    });
    const fileURL = URL.createObjectURL(fileBlob);
    var link = document.createElement('a');
    link.href = fileURL;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
  };

  const handleDownload = async (record) =>{
    let k = await download(record["fileId"], record["chunkCount"], record["name"], record["mimeType"])
  }

  const handleMarked = (record) =>{
    let temp = [...files]
    for(let i=0; i<temp.length; i++){
      if(temp[i]["fileId"]===record["fileId"]){
        temp[i]["marked"] = true
      }
    }
    console.log("list")
    console.log(temp)
    dispatch(filesUpdate(temp));
  }

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'File Size',
      dataIndex: 'chunkCount',
      key: 'chunkCount',
      render: text => <div>{text/2}MB</div>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Marked',
      dataIndex: 'marked',
      key: 'marked',
      render: (_, record) => <div>{record.marked?<BookOutlined style={{fontSize: "16px", color: "#edeb51"}} onClick={()=>handleMarked(record)} />:<BookOutlined style={{fontSize: "16px", color: "#000"}} onClick={()=>handleMarked(record)} />}</div>,
    },
    {
      title: '',
      key: 'operation',
      render: (_, record) => {
        return (
        <Space size="middle">
          <a>
            <DownloadOutlined onClick={()=>handleDownload(record)} />
          </a>
          <a>
            <EditOutlined />
          </a>
          <Popconfirm title="Sure to delete?" onConfirm={() => {}}>
          <a>
            <DeleteOutlined />
          </a>
          </Popconfirm>
        </Space>
        );
      },
    },
  ];

  return(
    <Style>
      <div>
        <Table dataSource={files} columns={columns} />
      </div>
    </Style>
  )
}

export default ListView;

const Style = styled.div`

`