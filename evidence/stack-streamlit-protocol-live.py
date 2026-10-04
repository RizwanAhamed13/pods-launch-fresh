import asyncio,json,sys
from websockets.asyncio.client import connect as websocket_connect
from streamlit.proto.BackMsg_pb2 import BackMsg
from streamlit.proto.ForwardMsg_pb2 import ForwardMsg
import streamlit

async def run(expected):
    assert streamlit.__version__=='1.65.0'
    async def connect():
        ws=await websocket_connect('ws://127.0.0.1:8080/_stcore/stream',subprotocols=['streamlit'],open_timeout=10)
        first=BackMsg();first.rerun_script.SetInParent();await ws.send(first.SerializeToString())
        return ws
    async def receive(ws,cache):
        result={}
        async with asyncio.timeout(20):
            for _ in range(200):
                raw=await ws.recv();assert isinstance(raw,bytes),'Expected a binary Streamlit message'
                msg=ForwardMsg();msg.ParseFromString(raw);kind=msg.WhichOneof('type')
                if kind=='ref_hash':assert msg.ref_hash in cache;msg=cache[msg.ref_hash];kind=msg.WhichOneof('type')
                elif msg.hash:cache[msg.hash]=msg
                if kind=='delta' and msg.delta.WhichOneof('type')=='new_element':
                    element=msg.delta.new_element;typ=element.WhichOneof('type')
                    if typ=='button' and element.button.label=='Add one':result['buttonId']=element.button.id
                    if typ=='metric' and element.metric.label=='Saved count':result['count']=int(element.metric.body)
                    if typ=='heading':result['heading']=element.heading.body
                    if typ=='exception':raise AssertionError('Streamlit returned an application exception')
                if kind=='script_finished':
                    status=msg.DESCRIPTOR.fields_by_name['script_finished'].enum_type.values_by_number[msg.script_finished].name
                    assert status=='FINISHED_SUCCESSFULLY',status
                    assert 'count' in result,result
                    return result
        raise AssertionError('Streamlit did not complete a script run')
    ws=await connect();cache={}
    try:
        before=await receive(ws,cache);assert before['count']==expected and before['heading']=='Streamlit + SQLite' and before['buttonId']
        message=BackMsg();widget=message.rerun_script.widget_states.widgets.add();widget.id=before['buttonId'];widget.trigger_value=True
        await ws.send(message.SerializeToString())
        after=await receive(ws,cache);assert after['count']==expected+1
    finally:await ws.close()
    ws=await connect()
    try:again=await receive(ws,{});assert again['count']==expected+1
    finally:await ws.close()
    return {'passed':True,'version':streamlit.__version__,'protocol':'Streamlit binary WebSocket widget interaction','heading':before['heading'],'before':before['count'],'afterWrite':after['count'],'afterReconnect':again['count']}
print(json.dumps(asyncio.run(run(int(sys.argv[1])))))
