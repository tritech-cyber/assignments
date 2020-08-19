import os
path = '/home/cwc/http/assignments/show/'
filelist = os.listdir(path)
#filelist.sort()
trimmed = list()
#papa.lstrip('papa')
for i in range (0,len(filelist)):
	temp = filelist[i]
	temp = temp.replace("wooten2018-","")
	temp = temp.replace(".jpg","")
	trimmed.append(temp)

for i in range (0,len(filelist)):
	#print ("mv ", filelist[i],trimmed[i])
	print("mv ", filelist[i], "pict"+str(i)+".jpg;")



"""

<li>	<a href="#">	<img src="images/thumbs/thumb-wooten2017-1.jpg" data-large="images/wooten2017-1.jpg" data-description="2017 # 1" />	</a>	</li>

>>> x = "Hello World!"
>>> x[2:]
'llo World!'
>>> x[:2]
'He'
>>> x[:-2]
'Hello Worl'
>>> x[-2:]
'd!'
>>> x[2:-2]
'llo Worl'





"""
