import json
import psycopg2
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send and retrieve messages
    Args: event with httpMethod (GET/POST), queryStringParameters or body with user_id, contact_id, group_id
    Returns: HTTP response with messages list or success status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            user_id = params.get('user_id')
            contact_id = params.get('contact_id')
            group_id = params.get('group_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id is required'}),
                    'isBase64Encoded': False
                }
            
            if contact_id:
                cur.execute("""
                    SELECT m.id, m.sender_id, u.username, m.message_text, m.created_at, m.is_read
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE (m.sender_id = %s AND m.receiver_id = %s) 
                       OR (m.sender_id = %s AND m.receiver_id = %s)
                    ORDER BY m.created_at ASC
                """, (user_id, contact_id, contact_id, user_id))
            
            elif group_id:
                cur.execute("""
                    SELECT m.id, m.sender_id, u.username, m.message_text, m.created_at, m.is_read
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.group_id = %s
                    ORDER BY m.created_at ASC
                """, (group_id,))
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'contact_id or group_id is required'}),
                    'isBase64Encoded': False
                }
            
            messages = cur.fetchall()
            
            messages_list = [
                {
                    'id': msg[0],
                    'sender_id': msg[1],
                    'sender_name': msg[2],
                    'text': msg[3],
                    'time': msg[4].strftime('%H:%M'),
                    'is_read': msg[5]
                }
                for msg in messages
            ]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            sender_id = body_data.get('sender_id')
            receiver_id = body_data.get('receiver_id')
            group_id = body_data.get('group_id')
            message_text = body_data.get('message_text', '').strip()
            
            if not sender_id or not message_text:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sender_id and message_text are required'}),
                    'isBase64Encoded': False
                }
            
            if not receiver_id and not group_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Either receiver_id or group_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO messages (sender_id, receiver_id, group_id, message_text) 
                   VALUES (%s, %s, %s, %s) 
                   RETURNING id, created_at""",
                (sender_id, receiver_id, group_id, message_text)
            )
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message_id': result[0],
                    'time': result[1].strftime('%H:%M')
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
