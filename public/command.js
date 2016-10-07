<html>
	<head>
		<style>
			#console {
				width:500px;
				height:300px;
			}
		</style>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
		<script type="text/javascript">
			function consolelog(message) {
				$("#console").append("\n"+message);	
			};
			function success(msg){
				consolelog("Success");	
			};
			$(function() {
				$("#fname").val("55");
				consolelog("Running Controller Page");
				
				$("input").click(function(){
					consolelog("Clicked on an input");
					$.post({ "command", { name: "nameHere" }, function() {consolelog("Post Finished");}});
					
				});
			});
			
		</script>
	</head>
	<body>
		<h3>Controller</h3>
		 <form action="controller" method="post">
			First name: <input type="text" id="fname" name="fname"><br>
			Last name: <input type="text" name="lname"><br>
			 <textarea id="console" >Text Area</textarea>
			<input type="submit" value="Submit">
		</form> 
		<script>
			console.log("End of page");
		</script>
	</body>
</html>