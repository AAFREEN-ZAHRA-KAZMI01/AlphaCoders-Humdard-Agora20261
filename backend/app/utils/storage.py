import asyncio
import uuid
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from ..core.config import get_settings

settings = get_settings()


def _minio_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.MINIO_ENDPOINT,
        aws_access_key_id=settings.MINIO_ROOT_USER,
        aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket() -> None:
    client = _minio_client()
    try:
        client.head_bucket(Bucket=settings.MINIO_BUCKET)
    except ClientError as e:
        if e.response["Error"]["Code"] in ("404", "NoSuchBucket"):
            client.create_bucket(Bucket=settings.MINIO_BUCKET)
            client.put_bucket_policy(
                Bucket=settings.MINIO_BUCKET,
                Policy=_public_read_policy(settings.MINIO_BUCKET),
            )
        else:
            raise


def _public_read_policy(bucket: str) -> str:
    import json
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": ["*"]},
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{bucket}/*"],
        }],
    })


def _public_url(key: str) -> str:
    return f"/files/{key}"


async def upload_file(data: bytes, folder: str, extension: str, content_type: str) -> str:
    key = f"{folder}/{uuid.uuid4()}.{extension}"
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: _minio_client().put_object(
            Bucket=settings.MINIO_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
        ),
    )
    return _public_url(key)
