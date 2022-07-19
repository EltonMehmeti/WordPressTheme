<?php

/*
Template Name: Contact Us
*/
?>
<head>
	
	<style type="text/css">

.widget{

        list-style-type: none;
        margin: 0;
        padding: 0;


    }
    .widget li{

        color: black;
        font-family: 'Times New Roman', cursive;
        font-size: 20px;
        text-align: left;
        list-style-type: none;
        margin: 5px 0;
        margin-left: -30px;
        margin-top: 5px;


    }
    .widget li a{
color: #ffc678;
        margin: 0;
        padding: 0;
        transition: 2s;

    }
    .widget li a:hover{

        color: darkgrey;


    }
    .widget ul{

        margin-top: 30px;
    }

    .widget h6{

          font-family: 'Times New Roman', cursive;

        }
        .widget h3{

          font-family: 'Times New Roman', cursive;
        }



@import url(https://fonts.googleapis.com/css?family=Montserrat:400,700);

body { background:rgb(30,30,40); }
form { max-width:420px; margin:50px auto; }

.feedback-input {
  color:white;
  font-family: Helvetica, Arial, sans-serif;
  font-weight:500;
  font-size: 18px;
  border-radius: 5px;
  line-height: 22px;
  background-color: transparent;
  border:2px solid #CC6666;
  transition: all 0.3s;
  padding: 13px;
  margin-bottom: 15px;
  width:100%;
  box-sizing: border-box;
  outline:0;
}

.feedback-input:focus { border:2px solid #CC4949; }

textarea {
  height: 150px;
  line-height: 150%;
  resize:vertical;
}

[type="submit"] {
  font-family: 'Montserrat', Arial, Helvetica, sans-serif;
  width: 100%;
  background:#CC6666;
  border-radius:5px;
  border:0;
  cursor:pointer;
  color:white;
  font-size:24px;
  padding-top:10px;
  padding-bottom:10px;
  transition: all 0.3s;
  margin-top:-4px;
  font-weight:700;
}
[type="submit"]:hover { background:#CC4949; }


	 </style>
</head>

<?php get_header();?>

<section class="page-wrap">
<div class="container">

<section class="row">
<div class="col-lg-3">


	<?php if(is_active_sidebar('contactus0sidebar')):?>
	<?php dynamic_sidebar('contactus0sidebar');?>

<?php endif;?>

</div>

	<h1><?php the_title();?></h1>	


	<div class="row">

		<div class="col-lg-6">
			<form>      
  <input name="name" type="text" class="feedback-input" placeholder="Name" />   
  <input name="email" type="text" class="feedback-input" placeholder="Email" />
  <textarea name="text" class="feedback-input" placeholder="Comment"></textarea>
  <input type="submit" value="SUBMIT"/>
</form>
		</div>
		<div class="col-lg-6">

<?php get_template_part('includes/section','content');?>
</div>

	</div>
</section>
</div>

	
</div>

</section>




<?php get_footer();?>